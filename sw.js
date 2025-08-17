<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw_kill.js")
      .then(reg => console.log("Kill switch ativo"))
      .catch(err => console.error("Erro ao registrar kill switch:", err));
  }
</script>
