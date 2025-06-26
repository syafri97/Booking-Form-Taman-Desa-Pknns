// public/script.js

const form = document.getElementById('bookingForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loading-spinner');
const maxCoapplicants = 3;
const wrapper = document.getElementById('coapplicants-wrapper');
const addBtn = document.getElementById('addCoapplicantBtn');
const template = document.getElementById('coapplicantTemplate');

function setupSignaturePad(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.offsetWidth || 300;
  const height = canvas.offsetHeight || 150;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function enableDrawing(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function move(e) {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function end() {
    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseout', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
}

function isEmpty(canvas) {
  const blank = document.createElement('canvas');
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

function updateCoapplicantList() {
  const list = [...wrapper.children];
  list.forEach((div, index) => {
    const num = index + 1;
    div.querySelector('h3').textContent = `Penama ${num}`;

    const inputs = div.querySelectorAll('input, select');
    inputs.forEach(input => {
      const label = input.previousElementSibling?.textContent || '';
      const base = label.includes('Nama') ? 'Name' :
                   label.includes('IC') ? 'IC' :
                   label.includes('Telefon') ? 'Phone' :
                   label.includes('Email') ? 'Email' :
                   label.includes('Bangsa') ? 'Race' :
                   label.includes('Jawatan') ? 'Position' : '';

      if (input.classList.contains('coapplicantRaceOther')) {
        input.name = `coapplicant${num}RaceOther`;
      } else {
        input.name = `coapplicant${num}${base}`;
      }
    });

    const canvas = div.querySelector('canvas');
    canvas.id = `signature${num}`;
    const clearBtn = div.querySelector('.clear-signature');
    clearBtn.dataset.pad = `signature${num}`;
    setupSignaturePad(canvas);
    enableDrawing(canvas);

    const raceDropdown = div.querySelector('.coapplicantRace');
    const otherInput = div.querySelector('.coapplicantRaceOther');
    raceDropdown.addEventListener('change', () => {
      otherInput.classList.toggle('hidden', raceDropdown.value !== 'Lain-lain');
    });
  });

  addBtn.classList.toggle('hidden', list.length >= maxCoapplicants);
}

function addCoapplicant() {
  if (wrapper.children.length >= maxCoapplicants) return;
  const clone = template.content.cloneNode(true);
  wrapper.appendChild(clone);
  updateCoapplicantList();
}

document.querySelector('[data-pad="signatureMain"]').addEventListener('click', () => {
  const canvas = document.getElementById('signatureMain');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
});

addBtn.addEventListener('click', addCoapplicant);

wrapper.addEventListener('click', e => {
  if (e.target.classList.contains('remove-coapplicant')) {
    e.target.closest('.coapplicant').remove();
    updateCoapplicantList();
  }
  if (e.target.classList.contains('clear-signature')) {
    const padId = e.target.dataset.pad;
    const canvas = document.getElementById(padId);
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
});

form.customerRace.addEventListener('change', () => {
  const otherInput = document.getElementById('customerRaceOther');
  otherInput.classList.toggle('hidden', form.customerRace.value !== 'Lain-lain');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const signatureMain = document.getElementById('signatureMain');
  if (isEmpty(signatureMain)) {
    errorMessage.textContent = "Sila tandatangan utama sebelum hantar.";
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    return;
  }

  const race = form.customerRace.value === 'Lain-lain'
    ? form.customerRaceOther.value.trim()
    : form.customerRace.value;

  if (form.customerRace.value === 'Lain-lain' && !form.customerRaceOther.value.trim()) {
    errorMessage.textContent = "Sila nyatakan bangsa anda.";
    errorMessage.classList.remove('hidden');
    return;
  }

  const formData = {
    customerName: form.customerName.value.trim(),
    customerIc: form.customerIc.value.trim(),
    customerAddress: form.customerAddress.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    customerPosition: form.customerPosition.value.trim(),
    customerRace: race,
    customerEmail: form.customerEmail.value.trim(),
    signatureData: signatureMain.toDataURL()
  };

  for (let i = 1; i <= maxCoapplicants; i++) {
    const nameField = form[`coapplicant${i}Name`];
    if (!nameField) continue;

    formData[`coapplicantName${i}`] = nameField.value.trim();
    formData[`coapplicantIC${i}`] = form[`coapplicant${i}IC`]?.value.trim() || "";
    formData[`coapplicantPhone${i}`] = form[`coapplicant${i}Phone`]?.value.trim() || "";
    formData[`coapplicantEmail${i}`] = form[`coapplicant${i}Email`]?.value.trim() || "";

    const raceValue = form[`coapplicant${i}Race`]?.value || "";
    const raceOther = form[`coapplicant${i}RaceOther`]?.value.trim() || "";
    formData[`coapplicantRace${i}`] = raceValue === "Lain-lain" && raceOther ? raceOther : raceValue;

    if (raceValue === "Lain-lain" && !raceOther) {
      errorMessage.textContent = `Sila nyatakan bangsa untuk Penama ${i}`;
      errorMessage.classList.remove('hidden');
      return;
    }

    formData[`coapplicantPosition${i}`] = form[`coapplicant${i}Position`]?.value.trim() || "";

    const sigCanvas = document.getElementById(`signature${i}`);
    if (sigCanvas && !isEmpty(sigCanvas)) {
      formData[`coapplicantSignatureData${i}`] = sigCanvas.toDataURL();
    }
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Menghantar...";
  loadingSpinner.classList.remove('hidden');

  try {
    const response = await fetch('/submitBooking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      successMessage.textContent = "Borang berjaya dihantar!";
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
      form.reset();
      ['signatureMain', 'signature1', 'signature2', 'signature3'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      });
      wrapper.innerHTML = '';
      updateCoapplicantList();
      document.getElementById('customerRaceOther').classList.add('hidden');
    } else {
      const data = await response.json();
      throw new Error(data.message || "Gagal hantar borang.");
    }
  } catch (err) {
    errorMessage.textContent = "Ralat: " + err.message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Hantar Borang";
    loadingSpinner.classList.add('hidden');
  }
});

setupSignaturePad(document.getElementById('signatureMain'));
enableDrawing(document.getElementById('signatureMain'));
updateCoapplicantList();
