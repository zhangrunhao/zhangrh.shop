const Hilo = window.Hilo;

if (!Hilo) {
  throw new Error("Legacy runtime Hilo is missing. Load script/hilo before the module entry.");
}

export default Hilo;
