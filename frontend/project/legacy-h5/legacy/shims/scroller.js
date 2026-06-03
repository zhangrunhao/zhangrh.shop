const Scroller = window.Scroller;

if (!Scroller) {
  throw new Error("Legacy runtime Scroller is missing. Load script/scroller before the module entry.");
}

export default Scroller;
