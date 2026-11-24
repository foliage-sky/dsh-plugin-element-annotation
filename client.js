/**
 * Client half of the element-annotation bundle.
 *
 * 按钮挂在右侧栏「文档预览」头部：
 * 1. 点击「批注」进入拾取模式，鼠标指向元素出现虚线高亮；
 * 2. 单击元素 = 元素级批注；按住左键拖拽 = 框选区域批注；
 * 3. 选定后保留虚线框，弹出单行输入小浮窗（参考系统样式），回车或点勾添加；
 * 4. 可连续添加多条，右下角面板汇总，「提交给 AI」写入输入框并尝试发送。
 */
window.__ModuleLoader__.load({
  id: '@local/element-annotation',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const UI_ATTR = 'data-dsh-annot-ui';

    const C = {
      accent: '#2f8fff',
      region: '#2f8fff',
      panelBg: 'var(--dsw-alias-fill-primary, #ffffff)',
      panelFg: 'var(--dsw-alias-label-primary, #1a1a1a)',
      border: 'var(--dsw-alias-border-l2, rgba(0,0,0,0.16))',
      muted: 'var(--dsw-alias-label-secondary, rgba(0,0,0,0.55))',
    };
    const FONT = 'var(--dsw-font-xs-13, 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif)';

    function isOwn(el) {
      return !!(el && el.closest && el.closest('[' + UI_ATTR + ']'));
    }

    function selectorOf(el) {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return '#' + el.id;
      const parts = [];
      let node = el;
      for (let i = 0; i < 6 && node && node.nodeType === 1; i += 1) {
        let part = node.tagName.toLowerCase();
        const parent = node.parentElement;
        if (parent) {
          const same = Array.prototype.filter.call(parent.children, (c) => c.tagName === node.tagName);
          if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
        }
        parts.unshift(part);
        if (!parent || parent === document.body) break;
        node = parent;
      }
      return parts.join(' > ');
    }

    function labelOf(el) {
      const text = String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      return text.slice(0, 100);
    }

    /** 空白区域：body/根节点/无文字且面积过半屏的大容器。 */
    function isBlankTarget(el) {
      if (!el || el === document.body || el === document.documentElement) return true;
      const text = labelOf(el);
      if (text) return false;
      const r = el.getBoundingClientRect();
      const area = Math.max(0, r.width) * Math.max(0, r.height);
      const viewport = window.innerWidth * window.innerHeight;
      return area > viewport * 0.5;
    }

    function visibleEditors() {
      return Array.prototype.filter.call(
        document.querySelectorAll('[contenteditable="true"]'),
        (el) => el && el.isConnected && el.getBoundingClientRect().width > 0,
      );
    }

    function insertTextAndSend(text) {
      const editors = visibleEditors();
      if (!editors.length) return { ok: false, reason: '未找到输入框' };
      editors.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
      const editor = editors[0];
      try { editor.focus(); } catch (e) { /* ignore */ }
      let inserted = false;
      try { inserted = document.execCommand('insertText', false, text); } catch (e) { inserted = false; }
      if (!inserted) {
        try {
          editor.dispatchEvent(new InputEvent('beforeinput', {
            inputType: 'insertText', data: text, bubbles: true, cancelable: true,
          }));
          inserted = true;
        } catch (e) { inserted = false; }
      }
      if (!inserted) return { ok: false, reason: '无法写入输入框，请手动粘贴' };
      setTimeout(() => {
        try {
          editor.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true,
          }));
        } catch (e) { /* ignore */ }
      }, 40);
      return { ok: true };
    }

    function buildMessage(notes) {
      const lines = ['请按以下批注修改当前预览的内容：'];
      notes.forEach((n, i) => {
        if (n.kind === 'region') {
          lines.push('' + (i + 1) + '. 位置：框选区域 ' + n.rect.w + '×' + n.rect.h + 'px'
            + (n.label ? '（区域文字：' + n.label + '）' : ''));
        } else {
          lines.push('' + (i + 1) + '. 位置：' + n.selector + (n.label ? '（页面文字：' + n.label + '）' : ''));
        }
        lines.push('   修改要求：' + n.comment);
      });
      return lines.join('\n');
    }

    function mkButton(label, onClick, kind) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute(UI_ATTR, '1');
      const primary = kind === 'primary';
      b.style.cssText = [
        'cursor:pointer', 'border-radius:6px', 'padding:4px 10px', 'font:' + FONT,
        'border:1px solid ' + (primary ? C.accent : C.border),
        'background:' + (primary ? C.accent : 'transparent'),
        'color:' + (primary ? '#fff' : C.panelFg),
      ].join(';');
      b.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); onClick(); });
      return b;
    }

    function AnnotationAction(props) {
      const filePath = props && typeof props.absolutePath === 'string' ? props.absolutePath : '';
      const [picking, setPicking] = React.useState(false);
      const [count, setCount] = React.useState(0);
      const [status, setStatus] = React.useState('');
      const notesRef = React.useRef([]);
      const pillRef = React.useRef(null);
      const outlineRef = React.useRef(null);
      const panelRef = React.useRef(null);
      const statusRef = React.useRef('');
      const pillDownRef = React.useRef(null);

      const setNoteStatus = (value) => {
        statusRef.current = value || '';
        setStatus(value || '');
        syncPanel();
      };

      const removeNode = (ref) => {
        if (ref.current) { ref.current.remove(); ref.current = null; }
      };

      const closeComposer = () => {
        if (pillDownRef.current) {
          document.removeEventListener('mousedown', pillDownRef.current, true);
          pillDownRef.current = null;
        }
        removeNode(pillRef);
        removeNode(outlineRef);
      };

      const closePanel = () => removeNode(panelRef);

      function syncPanel() {
        const notes = notesRef.current;
        if (!notes.length) { closePanel(); setCount(0); return; }
        setCount(notes.length);
        if (!panelRef.current) {
          const panel = document.createElement('div');
          panel.setAttribute(UI_ATTR, '1');
          panel.style.cssText = [
            'position:fixed', 'right:16px', 'bottom:96px', 'width:330px',
            'max-height:45vh', 'overflow:auto', 'z-index:2147483002',
            'background:' + C.panelBg, 'color:' + C.panelFg,
            'border:1px solid ' + C.border, 'border-radius:10px',
            'box-shadow:0 8px 24px rgba(0,0,0,0.18)', 'padding:8px 10px', 'font:' + FONT,
          ].join(';');
          document.body.appendChild(panel);
          panelRef.current = panel;
        }
        const panel = panelRef.current;
        panel.textContent = '';
        const head = document.createElement('div');
        head.style.cssText = 'font-weight:600;margin-bottom:6px;';
        head.textContent = '批注（' + notes.length + '）';
        panel.appendChild(head);

        notes.forEach((n, idx) => {
          const item = document.createElement('div');
          item.style.cssText = 'border:1px solid ' + C.border + ';border-radius:6px;padding:5px 7px;margin-bottom:5px;';
          const meta = document.createElement('div');
          meta.style.cssText = 'color:' + C.muted + ';';
          meta.textContent = (idx + 1) + '. ' + (n.kind === 'region'
            ? '框选 ' + n.rect.w + '×' + n.rect.h + 'px'
            : n.selector).slice(0, 80);
          const body = document.createElement('div');
          body.textContent = n.comment;
          const del = mkButton('删除', () => {
            notesRef.current = notesRef.current.filter((x) => x.id !== n.id);
            syncPanel();
          });
          del.style.cssText += ';margin-top:3px;padding:1px 8px;';
          item.appendChild(meta);
          item.appendChild(body);
          item.appendChild(del);
          panel.appendChild(item);
        });

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:4px;';
        row.appendChild(mkButton('清空', () => { notesRef.current = []; syncPanel(); }));
        row.appendChild(mkButton('提交给 AI', () => {
          const message = buildMessage(notesRef.current);
          const result = insertTextAndSend(message);
          if (result.ok) {
            notesRef.current = [];
            syncPanel();
            setNoteStatus('已写入输入框并尝试发送');
          } else {
            setNoteStatus('提交失败：' + (result.reason || '未知原因'));
            try { navigator.clipboard.writeText(message); } catch (e) { /* ignore */ }
          }
        }, 'primary'));
        panel.appendChild(row);
        if (statusRef.current) {
          const tip = document.createElement('div');
          tip.style.cssText = 'color:' + C.muted + ';margin-top:5px;';
          tip.textContent = statusRef.current;
          panel.appendChild(tip);
        }
      }

      /** 选定后保留的虚线框（带右上角小圆点），提示用户选的是哪里。 */
      const showOutline = (rect, color) => {
        removeNode(outlineRef);
        const wrap = document.createElement('div');
        wrap.setAttribute(UI_ATTR, '1');
        wrap.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;';
        const box = document.createElement('div');
        box.style.cssText = 'position:absolute;inset:0;border:2px dashed ' + color
          + ';border-radius:4px;background:rgba(47,143,255,0.06);';
        const dot = document.createElement('div');
        dot.style.cssText = 'position:absolute;right:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:'
          + color + ';box-shadow:0 0 0 2px rgba(255,255,255,0.8);';
        wrap.style.left = rect.left + 'px';
        wrap.style.top = rect.top + 'px';
        wrap.style.width = rect.width + 'px';
        wrap.style.height = rect.height + 'px';
        wrap.appendChild(box);
        wrap.appendChild(dot);
        document.body.appendChild(wrap);
        outlineRef.current = wrap;
      };

      /** 参考系统样式的单行输入小浮窗。 */
      const openComposer = (target) => {
        closeComposer();
        showOutline(target.rect, target.kind === 'region' ? C.region : C.accent);

        const pill = document.createElement('div');
        pill.setAttribute(UI_ATTR, '1');
        pill.style.cssText = [
          'position:fixed', 'z-index:2147483003', 'width:360px', 'max-width:calc(100vw - 24px)',
          'display:flex', 'align-items:center', 'gap:8px', 'box-sizing:border-box',
          'padding:6px 6px 6px 14px', 'border-radius:999px',
          'background:' + C.panelBg, 'border:1px solid ' + C.border,
          'box-shadow:0 6px 20px rgba(0,0,0,0.18)', 'font:' + FONT, 'color:' + C.panelFg,
        ].join(';');

        const input = document.createElement('input');
        input.setAttribute(UI_ATTR, '1');
        input.type = 'text';
        input.placeholder = '描述更改或提出问题';
        input.style.cssText = 'flex:1;min-width:0;border:none;outline:none;background:transparent;'
          + 'font:' + FONT + ';color:' + C.panelFg + ';padding:4px 0;';
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.setAttribute(UI_ATTR, '1');
        ok.title = '添加批注（Enter）';
        ok.textContent = '✓';
        ok.style.cssText = 'flex:none;width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;'
          + 'background:' + C.accent + ';color:#fff;font-size:14px;line-height:1;';

        const submit = () => {
          const comment = input.value.trim();
          if (!comment) { input.focus(); return; }
          notesRef.current = notesRef.current.concat([{
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            kind: target.kind,
            selector: target.selector || '',
            label: target.label || '',
            rect: target.rect ? { w: target.rect.width, h: target.rect.height } : null,
            comment,
          }]);
          closeComposer();
          syncPanel();
          setNoteStatus('已添加，共 ' + notesRef.current.length + ' 条');
        };

        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
          if (ev.key === 'Escape') { ev.preventDefault(); closeComposer(); }
        });
        ok.addEventListener('click', submit);

        pill.appendChild(input);
        pill.appendChild(ok);
        document.body.appendChild(pill);
        pillRef.current = pill;

        const cx = target.rect.left + target.rect.width / 2;
        const below = target.rect.top + target.rect.height + 10;
        const top = Math.max(8, Math.min(below, window.innerHeight - 52));
        const left = Math.max(8, Math.min(cx - 180, window.innerWidth - 372));
        pill.style.left = left + 'px';
        pill.style.top = top + 'px';

        // 浮窗外：单击空白=退出；按住左键拖拽=直接改选另一个区域
        const onOutsideDown = (ev) => {
          const t = ev.target;
          if (t && t.closest && t.closest('[' + UI_ATTR + ']')) return;
          startRetarget(ev);
        };
        document.addEventListener('mousedown', onOutsideDown, true);
        pillDownRef.current = onOutsideDown;

        setTimeout(() => { try { input.focus(); } catch (e) { /* ignore */ } }, 30);
      };

      /** 已锁定一个选区时，在别处拖拽即可改选新区域；单击空白则退出。 */
      function startRetarget(ev) {
        const start = { x: ev.clientX, y: ev.clientY };
        let dragging = false;
        let box = null;
        const onMove = (e) => {
          if (!dragging) {
            if (Math.max(Math.abs(e.clientX - start.x), Math.abs(e.clientY - start.y)) <= 6) return;
            dragging = true;
            closeComposer();
            box = document.createElement('div');
            box.setAttribute(UI_ATTR, '1');
            box.style.cssText = 'position:fixed;z-index:2147483003;pointer-events:none;border:2px dashed '
              + C.region + ';background:rgba(47,143,255,0.12);border-radius:2px;';
            document.body.appendChild(box);
          }
          box.style.left = Math.min(start.x, e.clientX) + 'px';
          box.style.top = Math.min(start.y, e.clientY) + 'px';
          box.style.width = Math.abs(e.clientX - start.x) + 'px';
          box.style.height = Math.abs(e.clientY - start.y) + 'px';
        };
        const onUp = (e) => {
          document.removeEventListener('mousemove', onMove, true);
          document.removeEventListener('mouseup', onUp, true);
          if (box) { box.remove(); box = null; }
          if (!dragging) { closeComposer(); return; }
          const left = Math.min(start.x, e.clientX);
          const top = Math.min(start.y, e.clientY);
          const width = Math.abs(e.clientX - start.x);
          const height = Math.abs(e.clientY - start.y);
          if (width < 8 || height < 8) return;
          const rect = { left, top, width, height };
          const stack = document.elementsFromPoint(left + width / 2, top + height / 2) || [];
          const el = stack.find((x) => !isOwn(x) && x !== document.documentElement && x !== document.body);
          openComposer({
            kind: 'region',
            rect,
            selector: el ? selectorOf(el) : '',
            label: el ? labelOf(el) : '',
          });
        };
        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup', onUp, true);
      }

      // 拾取模式：覆盖层 + 元素高亮 + 拖拽框选
      React.useEffect(() => {
        if (!picking) return undefined;
        const overlay = document.createElement('div');
        overlay.setAttribute(UI_ATTR, '1');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;cursor:crosshair;background:transparent;';
        const highlight = document.createElement('div');
        highlight.setAttribute(UI_ATTR, '1');
        highlight.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;display:none;border:2px dashed '
          + C.accent + ';background:rgba(47,143,255,0.10);border-radius:4px;';
        const box = document.createElement('div');
        box.setAttribute(UI_ATTR, '1');
        box.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;display:none;border:2px dashed '
          + C.region + ';background:rgba(245,166,35,0.12);border-radius:2px;';
        document.body.appendChild(overlay);
        document.body.appendChild(highlight);
        document.body.appendChild(box);

        let start = null;
        let dragging = false;
        let currentEl = null;

        const teardown = () => {
          document.removeEventListener('mousemove', onMove, true);
          document.removeEventListener('mousedown', onDown, true);
          document.removeEventListener('mouseup', onUp, true);
          document.removeEventListener('keydown', onKey, true);
          overlay.remove();
          highlight.remove();
          box.remove();
        };

        const onDown = (ev) => {
          if (ev.button !== 0) return;
          ev.preventDefault();
          ev.stopPropagation();
          start = { x: ev.clientX, y: ev.clientY };
          dragging = false;
        };

        const onMove = (ev) => {
          if (start) {
            const dx = ev.clientX - start.x;
            const dy = ev.clientY - start.y;
            if (!dragging && Math.max(Math.abs(dx), Math.abs(dy)) > 6) {
              dragging = true;
              highlight.style.display = 'none';
            }
            if (dragging) {
              box.style.display = 'block';
              box.style.left = Math.min(start.x, ev.clientX) + 'px';
              box.style.top = Math.min(start.y, ev.clientY) + 'px';
              box.style.width = Math.abs(dx) + 'px';
              box.style.height = Math.abs(dy) + 'px';
              return;
            }
          }
          const stack = document.elementsFromPoint(ev.clientX, ev.clientY) || [];
          const el = stack.find((x) => x !== overlay && x !== highlight && x !== box
            && !isOwn(x) && x !== document.documentElement && x !== document.body);
          currentEl = el || null;
          if (!el) { highlight.style.display = 'none'; return; }
          const r = el.getBoundingClientRect();
          highlight.style.display = 'block';
          highlight.style.left = r.left + 'px';
          highlight.style.top = r.top + 'px';
          highlight.style.width = r.width + 'px';
          highlight.style.height = r.height + 'px';
        };

        const onUp = (ev) => {
          if (!start) return;
          ev.preventDefault();
          ev.stopPropagation();
          const s = start;
          const wasDragging = dragging;
          start = null;
          if (wasDragging) {
            const left = Math.min(s.x, ev.clientX);
            const top = Math.min(s.y, ev.clientY);
            const width = Math.abs(ev.clientX - s.x);
            const height = Math.abs(ev.clientY - s.y);
            teardown();
            setPicking(false);
            if (width < 8 || height < 8) return;
            const rect = { left, top, width, height };
            const stack = document.elementsFromPoint(left + width / 2, top + height / 2) || [];
            const el = stack.find((x) => !isOwn(x) && x !== document.documentElement && x !== document.body);
            openComposer({
              kind: 'region',
              rect,
              selector: el ? selectorOf(el) : '',
              label: el ? labelOf(el) : '',
            });
            return;
          }
          const el = currentEl;
          teardown();
          setPicking(false);
          if (!el || isBlankTarget(el)) return;
          const r = el.getBoundingClientRect();
          openComposer({
            kind: 'element',
            rect: { left: r.left, top: r.top, width: r.width, height: r.height },
            selector: selectorOf(el),
            label: labelOf(el),
          });
        };

        const onKey = (ev) => {
          if (ev.key === 'Escape') { teardown(); setPicking(false); }
        };

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('mouseup', onUp, true);
        document.addEventListener('keydown', onKey, true);
        return teardown;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [picking]);

      React.useEffect(() => () => { closeComposer(); closePanel(); }, []);

      const style = {
        cursor: 'pointer',
        borderRadius: '6px',
        padding: '4px 10px',
        font: FONT,
        border: '1px solid ' + (picking ? C.accent : C.border),
        background: picking ? 'rgba(47,143,255,0.12)' : 'transparent',
        color: picking ? C.accent : C.panelFg,
        whiteSpace: 'nowrap',
      };
      return h('button', {
        type: 'button',
        style,
        'data-dsh-annot-ui': '1',
        title: (filePath ? filePath + '\n' : '')
          + '单击元素或按住左键框选区域；Esc 取消',
        onClick: () => setPicking((v) => !v),
      }, picking ? '取消批注（Esc）' : (count ? '批注（' + count + '）' : '批注'));
    }

    return {
      name: 'element-annotation',
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('sidebar.right.tab.document.actions', () => ctx.slots.register({
          name: 'sidebar.right.tab.document.actions',
          id: 'element-annotation',
        }, AnnotationAction));
      },
    };
  },
});
