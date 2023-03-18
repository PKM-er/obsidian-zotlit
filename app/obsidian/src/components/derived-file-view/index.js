import { TFile, FileView, debounce } from "obsidian";

export class DerivedFileView extends FileView {
  constructor(leaf) {
    super(leaf);
    this.navigation = false;
    this.allowNoFile = true;
    this.requestUpdate = debounce(() => this.update(), 0);
  }
  load() {
    super.load();
    this.registerEvent(
      this.app.workspace.on("file-open", this.onFileOpen, this),
    );
  }
  onLoadFile(_file) {
    return this.requestUpdate();
  }
  onUnloadFile(_file) {
    return this.requestUpdate();
  }
  onFileOpen(file) {
    this.leaf.group ||
      this.leaf.pinned ||
      (file instanceof TFile ? this.loadFile(file) : this.loadFile(null),
      this.requestUpdate());
  }
  onGroupChange() {
    if ((super.onGroupChange(), this.leaf.group))
      for (
        let i = 0, leaves = this.leaf.workspace.getGroupLeaves(this.leaf.group);
        i < leaves.length;
        i++
      ) {
        const leaf = leaves[i];
        if (leaf !== this.leaf && leaf.view instanceof FileView) {
          const state = leaf.view.getSyncViewState();
          this.leaf.openFile(leaf.view.file, state);
        }
      }
    else {
      const activeFile = this.leaf.workspace.getActiveFile();
      this.loadFile(activeFile);
    }
  }
}

// function(e) {
//   function t(t) {
//       var n = e.call(this, t) || this;
//       return n.navigation = !1,
//       n.allowNoFile = !0,
//       n.requestUpdate = Bb(n.update, 0),
//       n
//   }
//   return f(t, e),
//   t.prototype.load = function() {
//       e.prototype.load.call(this);
//       var t = this.app;
//       this.registerEvent(t.workspace.on("file-open", this.onFileOpen, this))
//   }
//   ,
//   t.prototype.onLoadFile = function(e) {
//       return m(this, void 0, Promise, (function() {
//           return v(this, (function(e) {
//               return this.requestUpdate(),
//               [2]
//           }
//           ))
//       }
//       ))
//   }
//   ,
//   t.prototype.onUnloadFile = function(e) {
//       return m(this, void 0, Promise, (function() {
//           return v(this, (function(e) {
//               return this.requestUpdate(),
//               [2]
//           }
//           ))
//       }
//       ))
//   }
//   ,
//   t.prototype.onFileOpen = function(e) {
//       this.leaf.group || this.leaf.pinned || (e instanceof CD ? this.loadFile(e) : this.loadFile(null),
//       this.requestUpdate())
//   }
//   ,
//   t.prototype.onGroupChange = function() {
//       if (e.prototype.onGroupChange.call(this),
//       this.leaf.group)
//           for (var t = 0, n = this.leaf.workspace.getGroupLeaves(this.leaf.group); t < n.length; t++) {
//               var i = n[t];
//               if (i !== this.leaf && i.view instanceof KA) {
//                   var r = i.view.getSyncViewState();
//                   this.leaf.openFile(i.view.file, r)
//               }
//           }
//       else {
//           var o = this.leaf.workspace.getActiveFile();
//           this.loadFile(o)
//       }
//   }
//   ,
//   t
// }
