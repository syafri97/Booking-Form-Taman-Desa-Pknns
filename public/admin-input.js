// =================== URL PARAMS ===================
const params = new URLSearchParams(window.location.search);
const submissionId = params.get("id");

// =================== GLOBAL BUYER DATA ===================
let buyerData = {};

// =================== PAPAR MAKLUMAT PEMBELI ===================
async function loadBuyerInfo() {
  try {
    const res = await fetch(`/admin/data/${submissionId}`);
    if (!res.ok) throw new Error("Gagal dapatkan data.");

    const data = await res.json();
    buyerData = data; // Simpan supaya boleh hantar ke server

    document.getElementById("buyerName").textContent = data.customerName || "-";
    document.getElementById("buyerIC").textContent = data.customerIc || "-";
    document.getElementById("buyerEmail").textContent = data.customerEmail || "-";
  } catch (err) {
    console.error("❌ Ralat paparkan maklumat pembeli:", err.message);
    alert("❌ Gagal dapatkan maklumat pembeli.");
  } finally {
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

// =================== SEMAK ID & AUTO LOAD ===================
if (!submissionId) {
  alert("❌ Ralat: ID borang tidak dijumpai dalam URL.");
  document.getElementById("loadingOverlay").style.display = "none";
} else {
  loadBuyerInfo(); // Run only if ID is valid
}

// =================== SUBMIT FORM ===================
document.getElementById("propertyForm").addEventListener("submit", async function (e) {
  e.preventDefault();
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

  // 🔥 Tambah field dari buyerData
  payload.customerName = buyerData.customerName;
  payload.customerIc = buyerData.customerIc;
  payload.customerEmail = buyerData.customerEmail;
  payload.customerPhone = buyerData.customerPhone;
  payload.customerPosition = buyerData.customerPosition;
  payload.customerAddress = buyerData.customerAddress;
  payload.customerRace = buyerData.customerRace;

  console.log("📤 Payload Dihantar:", payload);

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

// Timeout 10 saat kalau server lambat
setTimeout(() => {
  document.getElementById("loadingOverlay").style.display = "none";
  alert("⛔ Server ambil masa terlalu lama. Sila cuba semula.");
}, 10000);

// =================== HARGA CUSTOM ===================
function toggleHargaCustom(select) {
  const container = document.getElementById('hargaCustomContainer');
  if (select.value === 'lain') {
    container.style.display = 'block';
    document.getElementById('hargaCustomInput').focus();
    document.getElementById('hargaAsal').value = '';
    triggerCalc();
  } else {
    container.style.display = 'none';
    document.getElementById('hargaCustomInput').value = '';
    document.getElementById('hargaAsal').value = select.value;
    triggerCalc();
  }
}

function setHargaCustom(input) {
  const raw = input.value.replace(/[^\d]/g, '');
  document.getElementById('hargaAsal').value = raw;
  triggerCalc();
}

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
    jumlahDiskaun.value = amaunDiskaun.toFixed(0);
    const hargaSPAVal = asal - amaunDiskaun;
    hargaSPA.value = hargaSPAVal.toFixed(0);
    return hargaSPAVal;
  }

  function kiraHargaFinal() {
    const spa = kiraHargaSPA();
    const rebateVal = parseFloat(rebate.value) || 0;
    const amaunRebat = spa * rebateVal / 100;
    jumlahRebat.value = amaunRebat.toFixed(0);
    const hargaFinalVal = spa - amaunRebat;
    hargaFinal.value = hargaFinalVal.toFixed(0);
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

// =================== TRIGGER KALKULASI ===================
function triggerCalc() {
  const hargaAsal = document.getElementById('hargaAsal');
  const event = new Event('input', { bubbles: true });
  hargaAsal.dispatchEvent(event);
}
