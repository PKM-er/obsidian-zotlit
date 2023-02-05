import { Keymap, Platform } from "obsidian";

function onEditorClick(event, delegateTarget) {
  if (
    !(Platform.isMobile
      ? (Platform.isAndroidApp && "mousedown" === event.type) ||
        ("click" === event.type && !event.isTrusted && !!delegateTarget) ||
        (Platform.isIosApp && "click" === event.type && event.isTrusted)
      : ("click" === event.type && 0 === event.button) ||
        ("mousedown" === event.type && 1 === event.button))
  )
    return;

  const isMod = Keymap.isModifier(event, "Mod") || event.button === 1;
  if (
    !(
      (!this.sourceMode || isMod) &&
      (this.sourceMode ||
        0 !== event.button ||
        isMod ||
        (!event.altKey && !event.shiftKey))
    )
  )
    return;

  const target = delegateTarget || event.target,
    contentDOM = this.cm.contentDOM;

  if (
    !(
      contentDOM.contains(target) &&
      target !== contentDOM &&
      target.parentNode !== contentDOM
    )
  )
    return;

  let node = target;
  do {
    if (
      node.instanceOf(HTMLElement) &&
      "false" === node.contentEditable &&
      !node.hasClass("external-link") &&
      !node.draggable
    )
      return;
    node = node.parentNode;
  } while (node && node !== contentDOM);

  const token = this.editor.getClickableTokenAt(this.editor.posAtMouse(event));
  if (!token) return;

  let isModEvent = Keymap.isModEvent(event);

  const shouldTrigger = () => {
    if (this.sourceMode) return true;
    if (isModEvent) return true;
    if (!target.instanceOf(HTMLElement)) return false;
    if ("tag" === token.type) return true;
    if ("internal-link" === token.type) {
      if (!target.matchParent(".cm-underline")) return false;
      if (target.matchParent(".cm-hmd-internal-link")) return true;
      if (target.matchParent(".cm-link")) return true;
    }
    if ("external-link" === token.type) {
      if (target.matchParent(".external-link")) return true;
      if (!target.matchParent(".cm-underline")) return false;
      if (target.matchParent(".cm-url")) return true;
      if (target.matchParent(".cm-link")) return true;
    }
    return false;
  };
  if (!shouldTrigger()) return;
  if (
    this.sourceMode &&
    "tab" === isModEvent &&
    1 !== event.button &&
    !Keymap.isModifier(event, "Shift")
  ) {
    isModEvent = false;
  }
  this.triggerClickableToken(token, isModEvent);
  event.preventDefault();
}
