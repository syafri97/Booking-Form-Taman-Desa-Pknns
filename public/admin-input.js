
// =================== URL PARAMS ===================
const params = new URLSearchParams(window.location.search);
const submissionId = params.get("id");

// =================== PAPAR MAKLUMAT PEMBELI ===================
async function loadBuyerInfo() {
  if (!submissionId) return;

  try {
    const res = await fetch(`/admin/data/${submissionId}`);
    if (!res.ok) throw new Error("Gagal dapatkan data.");

    const data = await res.json();
    document.getElementById("buyerName").textContent = data.customerName || "-";
    document.getElementById("buyerIC").textContent = data.customerIc || "-";
    document.getElementById("buyerEmail").textContent = data.customerEmail || "-";
  } catch (err) {
    console.error("❌ Ralat paparkan maklumat pembeli:", err.message);
  }
}

loadBuyerInfo(); // Auto run on load

// =================== SUBMIT FORM ===================
document.getElementById("propertyForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // 🚀 Tunjuk loading spinner
  document.getElementById("loadingOverlay").style.display = "flex";

  const formData = new FormData(this);
  const payload = {};

  formData.forEach((value, key) => {
    if (payload[key]) {
      if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
      payload[key].push(value);
    } else {
      payload[key] = value;
    }
  });

  try {
    const res = await fetch(`/admin/generate-pdf/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      setTimeout(() => {
        document.getElementById("loadingOverlay").style.display = "none";
        alert("✅ Maklumat berjaya dihantar & PDF dijana.");
        window.location.href = "/admin.html";
      }, 500);
    } else {
      document.getElementById("loadingOverlay").style.display = "none";
      alert("❌ Gagal hantar: " + (result.message || "Ralat tidak diketahui"));
    }
  } catch (err) {
    document.getElementById("loadingOverlay").style.display = "none";
    alert("❌ Ralat sambungan: " + err.message);
  }
});

// =================== KALKULASI ===================
document.addEventListener('DOMContentLoaded', () => {
  const luasStandard = document.getElementById('luasStandard');
  const luasLebihan = document.getElementById('luasLebihan');
  const luasJumlah = document.getElementById('luasJumlah');

  const hargaAsal = document.getElementById('hargaAsal');
  const diskaun = document.getElementById('diskaunBumi');
  const jumlahDiskaun = document.getElementById('jumlahDiskaun');
  const hargaSPA = document.getElementById('hargaSPA');

  const rebate = document.getElementById('rebate');
  const jumlahRebat = document.getElementById('jumlahRebat');
  const hargaFinal = document.getElementById('hargaFinal');

  function kiraLuasJumlah() {
    const standard = parseFloat(luasStandard.value) || 0;
    const lebihan = parseFloat(luasLebihan.value) || 0;
    luasJumlah.value = standard + lebihan;
  }

  function kiraHargaSPA() {
    const asal = parseFloat(hargaAsal.value) || 0;
    const dis = parseFloat(diskaun.value) || 0;
    const amaunDiskaun = asal * dis / 100;
    jumlahDiskaun.value = amaunDiskaun.toFixed(2);
    const hargaSPAVal = asal - amaunDiskaun;
    hargaSPA.value = hargaSPAVal.toFixed(2);
    return hargaSPAVal;
  }

  function kiraHargaFinal() {
    const spa = kiraHargaSPA();
    const rebateVal = parseFloat(rebate.value) || 0;
    const amaunRebat = spa * rebateVal / 100;
    jumlahRebat.value = amaunRebat.toFixed(2);
    const hargaFinalVal = spa - amaunRebat;
    hargaFinal.value = hargaFinalVal.toFixed(2);
  }

  luasStandard.addEventListener('input', kiraLuasJumlah);
  luasLebihan.addEventListener('input', kiraLuasJumlah);
  hargaAsal.addEventListener('input', () => {
    kiraHargaSPA();
    kiraHargaFinal();
  });
  diskaun.addEventListener('change', () => {
    kiraHargaSPA();
    kiraHargaFinal();
  });
  rebate.addEventListener('input', kiraHargaFinal);

  kiraLuasJumlah();
  kiraHargaSPA();
  kiraHargaFinal();
});
