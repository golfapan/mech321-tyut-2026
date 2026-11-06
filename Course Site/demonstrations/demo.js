const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const theme = () => {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue('--text').trim(),
    muted: css.getPropertyValue('--muted').trim(),
    line: 'rgba(165,202,227,.18)',
    teal: css.getPropertyValue('--teal').trim(),
    amber: css.getPropertyValue('--amber').trim(),
    red: css.getPropertyValue('--red').trim(),
    blue: css.getPropertyValue('--blue').trim(),
  };
};

function canvasContext(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return {ctx, width: rect.width, height: rect.height};
}

function niceNumber(value) {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 10) return value.toFixed(1);
  if (absolute >= 1) return value.toFixed(2).replace(/\.00$/, '');
  if (absolute === 0) return '0';
  return value.toFixed(2);
}

function mapLinear(value, domainMin, domainMax, rangeMin, rangeMax) {
  return rangeMin + (value - domainMin) * (rangeMax - rangeMin) / (domainMax - domainMin || 1);
}

function drawGrid(ctx, box, xTicks, yTicks, xMap, yMap, xFormat = niceNumber, yFormat = niceNumber) {
  const c = theme();
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.strokeStyle = c.line;
  ctx.fillStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.textBaseline = 'middle';
  xTicks.forEach((tick) => {
    const x = xMap(tick);
    ctx.beginPath(); ctx.moveTo(x, box.top); ctx.lineTo(x, box.bottom); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(xFormat(tick), x, box.bottom + 17);
  });
  yTicks.forEach((tick) => {
    const y = yMap(tick);
    ctx.beginPath(); ctx.moveTo(box.left, y); ctx.lineTo(box.right, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(yFormat(tick), box.left - 8, y);
  });
  ctx.strokeStyle = 'rgba(165,202,227,.34)';
  ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
}

function drawSeries(ctx, points, xMap, yMap, color, width = 2.5, dash = []) {
  if (!points.length) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xMap(point.x); const y = yMap(point.y);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke(); ctx.restore();
}

function drawAxisLabels(ctx, width, height, xLabel, yLabel) {
  const c = theme();
  ctx.save(); ctx.fillStyle = c.muted; ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.fillText(xLabel, width - 12, height - 5);
  ctx.translate(13, 18); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(yLabel, 0, 0); ctx.restore();
}

function drawTimePlot(canvas, points, inputType, options = {}) {
  const {ctx, width, height} = canvasContext(canvas);
  const c = theme();
  const box = {left: 55, right: width - 16, top: 14, bottom: height - 38};
  const tMax = points[points.length - 1].x;
  const input = points.map((p) => ({x: p.x, y: inputType === 'step' ? 1 : p.x}));
  const values = points.flatMap((p, i) => [p.y, input[i].y]);
  let yMin = options.yMin ?? Math.min(0, ...values); let yMax = options.yMax ?? Math.max(...values);
  if (options.yMin === undefined || options.yMax === undefined) {
    const pad = Math.max((yMax - yMin) * .1, .08);
    yMin -= pad * .2; yMax += pad;
  }
  const xMap = (v) => mapLinear(v, 0, tMax, box.left, box.right);
  const yMap = (v) => mapLinear(v, yMin, yMax, box.bottom, box.top);
  const xTicks = [0, .25, .5, .75, 1].map((v) => v * tMax);
  const yTicks = [0, .25, .5, .75, 1].map((v) => yMin + v * (yMax - yMin));
  drawGrid(ctx, box, xTicks, yTicks, xMap, yMap);

  if (inputType === 'step' && options.finalValue > 0) {
    ctx.save(); ctx.fillStyle = 'rgba(93,224,206,.07)';
    const high = yMap(options.finalValue * 1.02); const low = yMap(options.finalValue * .98);
    ctx.fillRect(box.left, high, box.right - box.left, low - high);
    ctx.restore();
  }
  if (inputType === 'step' && options.timeMarkers) {
    options.timeMarkers.forEach((marker, index) => {
      if (marker.x < 0) return;
      if (marker.x > tMax) {
        ctx.save(); ctx.fillStyle = marker.color || c.amber; ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(`${marker.label} · outside 10 s view`, box.right - 6, box.top + 6 + index * 14); ctx.restore();
        return;
      }
      const x = xMap(marker.x), color = marker.color || c.amber;
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(x, box.top); ctx.lineTo(x, box.bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
      ctx.textAlign = x > box.right - 110 ? 'right' : 'left';
      ctx.fillText(marker.label, x + (ctx.textAlign === 'right' ? -6 : 6), box.top + 6 + index * 14);
      if (Number.isFinite(marker.y)) { ctx.beginPath(); ctx.arc(x, yMap(marker.y), 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
  }
  drawSeries(ctx, input, xMap, yMap, c.amber, 1.8, [6, 5]);
  drawSeries(ctx, points, xMap, yMap, c.teal, 3);
  if (options.peak && inputType === 'step') {
    const x = xMap(options.peak.x), y = yMap(options.peak.y);
    ctx.fillStyle = c.red; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    if (options.peakLabel) {
      ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(options.peakLabel, x + 7, y - 5);
    }
  }
  drawAxisLabels(ctx, width, height, 'time (s)', 'amplitude');
}

function drawPolePlot(canvas, poles) {
  const {ctx, width, height} = canvasContext(canvas);
  const c = theme();
  const box = {left: 48, right: width - 16, top: 14, bottom: height - 38};
  const maxReal = Math.max(1, ...poles.map((p) => Math.abs(p.re))) * 1.35;
  const maxImag = Math.max(.8, ...poles.map((p) => Math.abs(p.im)), maxReal * .55) * 1.25;
  const xMin = -maxReal, xMax = maxReal * .22, yMin = -maxImag, yMax = maxImag;
  const xMap = (v) => mapLinear(v, xMin, xMax, box.left, box.right);
  const yMap = (v) => mapLinear(v, yMin, yMax, box.bottom, box.top);
  drawGrid(ctx, box, [xMin, xMin / 2, 0], [-maxImag, 0, maxImag], xMap, yMap);
  ctx.save(); ctx.strokeStyle = c.muted; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xMap(0), box.top); ctx.lineTo(xMap(0), box.bottom); ctx.moveTo(box.left, yMap(0)); ctx.lineTo(box.right, yMap(0)); ctx.stroke();
  poles.forEach((pole) => {
    const x = xMap(pole.re), y = yMap(pole.im), size = 8;
    ctx.strokeStyle = c.red; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke();
  });
  ctx.restore(); drawAxisLabels(ctx, width, height, 'Re(s)', 'Im(s)');
}

function drawZeroTimePlot(canvas, baseline, modified, finalValue) {
  const {ctx, width, height} = canvasContext(canvas), c = theme();
  const box = {left: 55, right: width - 16, top: 14, bottom: height - 38};
  const tMax = baseline[baseline.length - 1].x, yMin = -2.5, yMax = 4;
  const xMap = (v) => mapLinear(v, 0, tMax, box.left, box.right);
  const yMap = (v) => mapLinear(v, yMin, yMax, box.bottom, box.top);
  drawGrid(ctx, box, [0, 2.5, 5, 7.5, 10], [-2, 0, 1, 2, 4], xMap, yMap);
  ctx.save(); ctx.fillStyle = 'rgba(93,224,206,.07)';
  ctx.fillRect(box.left, yMap(1.02), box.right - box.left, yMap(.98) - yMap(1.02)); ctx.restore();
  const input = baseline.map((p) => ({x: p.x, y: 1}));
  const normalise = (points) => points.map((p) => ({x: p.x, y: p.y / finalValue}));
  drawSeries(ctx, input, xMap, yMap, c.amber, 1.8, [6, 5]);
  drawSeries(ctx, normalise(baseline), xMap, yMap, c.muted, 2, [6, 5]);
  const normalised = normalise(modified);
  drawSeries(ctx, normalised, xMap, yMap, c.teal, 3);
  const maxPoint = normalised.reduce((best, point) => point.y > best.y ? point : best, normalised[0]);
  const minPoint = normalised.reduce((best, point) => point.y < best.y ? point : best, normalised[0]);
  [maxPoint, minPoint].forEach((point) => { ctx.fillStyle = point.y < 0 ? c.red : c.teal; ctx.beginPath(); ctx.arc(xMap(point.x), yMap(point.y), 4, 0, Math.PI * 2); ctx.fill(); });
  drawAxisLabels(ctx, width, height, 'time (s)', 'normalised output y/K');
}

function drawPoleZeroPlot(canvas, poles, zero, wn) {
  const {ctx, width, height} = canvasContext(canvas), c = theme();
  const box = {left: 48, right: width - 16, top: 14, bottom: height - 38};
  const normalisedPoles = poles.map((pole) => ({re: pole.re / wn, im: pole.im / wn}));
  const normalisedZero = zero === null ? null : zero / wn;
  // Keep one fixed, normalised coordinate system for every zero position. This
  // makes the circle visibly move while the axes and pole markers stay still.
  const xMin = -10.8, xMax = 10.8, yMin = -1.2, yMax = 1.2;
  const xMap = (v) => mapLinear(v, xMin, xMax, box.left, box.right);
  const yMap = (v) => mapLinear(v, yMin, yMax, box.bottom, box.top);
  drawGrid(ctx, box, [-10, -5, 0, 5, 10], [-1, 0, 1], xMap, yMap);
  ctx.save(); ctx.strokeStyle = c.muted; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xMap(0), box.top); ctx.lineTo(xMap(0), box.bottom); ctx.moveTo(box.left, yMap(0)); ctx.lineTo(box.right, yMap(0)); ctx.stroke();
  normalisedPoles.forEach((pole) => {
    const x = xMap(pole.re), y = yMap(pole.im), size = 8;
    ctx.strokeStyle = c.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke();
  });
  if (normalisedZero !== null) {
    ctx.strokeStyle = c.teal; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(xMap(normalisedZero), yMap(0), 8, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore(); drawAxisLabels(ctx, width, height, 'Re(s/ωn)', 'Im(s/ωn)');
}

function drawBodePlot(canvas, samples, annotations = []) {
  const {ctx, width, height} = canvasContext(canvas);
  const c = theme();
  const left = 58, right = width - 16, split = height / 2;
  const topBox = {left, right, top: 10, bottom: split - 25};
  const bottomBox = {left, right, top: split + 10, bottom: height - 38};
  const logs = samples.map((p) => Math.log10(p.w));
  const xMin = logs[0], xMax = logs[logs.length - 1];
  const magValues = samples.map((p) => p.mag);
  let magMin = Math.floor(Math.min(...magValues) / 20) * 20;
  let magMax = Math.ceil(Math.max(...magValues) / 20) * 20;
  if (magMin === magMax) { magMin -= 20; magMax += 20; }
  const phaseValues = samples.map((p) => p.phase);
  let phaseMin = Math.floor(Math.min(...phaseValues) / 45) * 45;
  let phaseMax = Math.ceil(Math.max(...phaseValues) / 45) * 45;
  if (phaseMin === phaseMax) phaseMin -= 45;
  const xMap = (v) => mapLinear(Math.log10(v), xMin, xMax, left, right);
  const topY = (v) => mapLinear(v, magMin, magMax, topBox.bottom, topBox.top);
  const bottomY = (v) => mapLinear(v, phaseMin, phaseMax, bottomBox.bottom, bottomBox.top);
  const xPowers = [];
  for (let p = Math.ceil(xMin); p <= Math.floor(xMax); p += 1) xPowers.push(10 ** p);
  const magTicks = [0, .5, 1].map((v) => magMin + v * (magMax - magMin));
  const phaseTicks = [0, .5, 1].map((v) => phaseMin + v * (phaseMax - phaseMin));
  drawGrid(ctx, topBox, xPowers, magTicks, xMap, topY, (v) => `10^${Math.round(Math.log10(v))}`, (v) => `${Math.round(v)}`);
  drawGrid(ctx, bottomBox, xPowers, phaseTicks, xMap, bottomY, (v) => `10^${Math.round(Math.log10(v))}`, (v) => `${Math.round(v)}°`);
  drawSeries(ctx, samples.map((p) => ({x: p.w, y: p.mag})), xMap, topY, c.teal, 2.6);
  drawSeries(ctx, samples.map((p) => ({x: p.w, y: p.phase})), xMap, bottomY, c.blue, 2.6);
  annotations.filter((item) => item.w >= samples[0].w && item.w <= samples[samples.length - 1].w).forEach((item, index) => {
    const x = xMap(item.w), color = item.color || c.amber;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.25;
    if (item.line) {
      ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x, topBox.top); ctx.lineTo(x, bottomBox.bottom); ctx.stroke(); ctx.setLineDash([]);
    }
    if (Number.isFinite(item.mag)) { ctx.beginPath(); ctx.arc(x, topY(item.mag), 4, 0, Math.PI * 2); ctx.fill(); }
    if (Number.isFinite(item.phase)) { ctx.beginPath(); ctx.arc(x, bottomY(item.phase), 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
    ctx.textAlign = x > right - 105 ? 'right' : 'left';
    ctx.fillText(item.label, x + (ctx.textAlign === 'right' ? -6 : 6), topBox.top + 7 + index * 14);
    ctx.restore();
  });
  ctx.save(); ctx.fillStyle = c.muted; ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('magnitude (dB)', left, 8); ctx.fillText('phase', left, split + 7);
  ctx.textAlign = 'right'; ctx.fillText('angular frequency (rad/s)', right, height - 5); ctx.restore();
}

function drawNyquistPlot(canvas, samples, highlight = null) {
  const {ctx, width, height} = canvasContext(canvas);
  const c = theme();
  const box = {left: 50, right: width - 16, top: 14, bottom: height - 38};
  const all = samples.concat(samples.map((p) => ({re: p.re, im: -p.im})));
  const span = Math.max(.4, ...all.flatMap((p) => [Math.abs(p.re), Math.abs(p.im)])) * 1.18;
  const xMin = Math.min(-1.15, -.25 * span, ...all.map((p) => p.re)) - .08 * span;
  const xMax = Math.max(span * .25, ...all.map((p) => p.re)) + .08 * span;
  const yMin = -span, yMax = span;
  const xMap = (v) => mapLinear(v, xMin, xMax, box.left, box.right);
  const yMap = (v) => mapLinear(v, yMin, yMax, box.bottom, box.top);
  drawGrid(ctx, box, [xMin, 0, xMax], [yMin, 0, yMax], xMap, yMap);
  ctx.save(); ctx.strokeStyle = c.muted; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xMap(0), box.top); ctx.lineTo(xMap(0), box.bottom); ctx.moveTo(box.left, yMap(0)); ctx.lineTo(box.right, yMap(0)); ctx.stroke(); ctx.restore();
  drawSeries(ctx, samples.map((p) => ({x: p.re, y: p.im})), xMap, yMap, c.teal, 2.6);
  drawSeries(ctx, [...samples].reverse().map((p) => ({x: p.re, y: -p.im})), xMap, yMap, c.blue, 1.8, [5, 4]);
  if (highlight) {
    const drawArrow = (from, to, color) => {
      const x1 = xMap(from.re), y1 = yMap(from.im), x2 = xMap(to.re), y2 = yMap(to.im);
      const angle = Math.atan2(y2 - y1, x2 - x1), size = 8;
      ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - size * Math.cos(angle - .5), y2 - size * Math.sin(angle - .5));
      ctx.lineTo(x2 - size * Math.cos(angle + .5), y2 - size * Math.sin(angle + .5));
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const arrowIndex = Math.max(2, Math.min(samples.length - 2, Math.round(samples.length * .38)));
    drawArrow(samples[arrowIndex - 2], samples[arrowIndex], c.teal);
    drawArrow({re: samples[arrowIndex].re, im: -samples[arrowIndex].im}, {re: samples[arrowIndex - 2].re, im: -samples[arrowIndex - 2].im}, c.blue);
    const low = samples[0], high = samples[samples.length - 1];
    ctx.save(); ctx.fillStyle = c.muted; ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.fillText('ω ≈ 0', xMap(low.re) + 7, yMap(low.im) - 9);
    ctx.textAlign = 'right'; ctx.fillText('ω → ∞', xMap(high.re) - 7, yMap(high.im) + 14);
    ctx.fillStyle = c.red; ctx.beginPath(); ctx.arc(xMap(highlight.re), yMap(highlight.im), 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = highlight.re > (xMin + xMax) / 2 ? 'right' : 'left';
    ctx.fillText(`ω = ${highlight.w.toFixed(2)}`, xMap(highlight.re) + (ctx.textAlign === 'right' ? -8 : 8), yMap(highlight.im) - 10);
    ctx.restore();
  }
  ctx.fillStyle = c.red; ctx.beginPath(); ctx.arc(xMap(-1), yMap(0), 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.font = '11px Inter, system-ui, sans-serif'; ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.fillText('−1', xMap(-1) + 7, yMap(0) - 9);
  drawAxisLabels(ctx, width, height, 'Re{G(jω)}', 'Im{G(jω)}');
}

function drawFrequencyVector(canvas, point, scale) {
  const {ctx, width, height} = canvasContext(canvas);
  const c = theme();
  const box = {left: 54, right: width - 18, top: 18, bottom: height - 42};
  const span = Math.max(.2, scale);
  const xMap = (v) => mapLinear(v, -span, span, box.left, box.right);
  const yMap = (v) => mapLinear(v, -span, span, box.bottom, box.top);
  drawGrid(ctx, box, [-span, 0, span], [-span, 0, span], xMap, yMap);
  const origin = {x: xMap(0), y: yMap(0)}, end = {x: xMap(point.re), y: yMap(point.im)};
  ctx.save();
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(xMap(0), box.top); ctx.lineTo(xMap(0), box.bottom); ctx.moveTo(box.left, yMap(0)); ctx.lineTo(box.right, yMap(0)); ctx.stroke();
  ctx.strokeStyle = c.amber; ctx.lineWidth = 1.3; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(end.x, origin.y); ctx.lineTo(end.x, end.y); ctx.lineTo(origin.x, end.y); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = c.teal; ctx.fillStyle = c.teal; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  const angle = Math.atan2(point.im, point.re), arrowAngle = Math.atan2(end.y - origin.y, end.x - origin.x), arrowSize = 9;
  ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - arrowSize * Math.cos(arrowAngle - .45), end.y - arrowSize * Math.sin(arrowAngle - .45)); ctx.lineTo(end.x - arrowSize * Math.cos(arrowAngle + .45), end.y - arrowSize * Math.sin(arrowAngle + .45)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c.red; ctx.beginPath(); ctx.arc(end.x, end.y, 5, 0, Math.PI * 2); ctx.fill();
  const arcRadius = Math.min(38, Math.hypot(end.x - origin.x, end.y - origin.y) * .35);
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(origin.x, origin.y, arcRadius, 0, -angle, angle > 0); ctx.stroke();
  ctx.font = '11px Inter, system-ui, sans-serif'; ctx.fillStyle = c.amber;
  ctx.textAlign = 'center'; ctx.fillText(`Re = ${point.re.toFixed(3)}`, end.x, origin.y + (point.im < 0 ? -8 : 16));
  ctx.textAlign = point.re >= 0 ? 'right' : 'left'; ctx.fillText(`Im = ${point.im.toFixed(3)}`, origin.x + (point.re >= 0 ? -7 : 7), end.y - 7);
  ctx.fillStyle = c.text; ctx.textAlign = point.re >= 0 ? 'left' : 'right'; ctx.fillText(`G(jω)`, end.x + (point.re >= 0 ? 7 : -7), end.y - 8);
  ctx.restore();
  drawAxisLabels(ctx, width, height, 'real part', 'imaginary part');
}

function logSamples(start, end, count, mapper) {
  const a = Math.log10(start), b = Math.log10(end);
  return Array.from({length: count}, (_, i) => mapper(10 ** (a + (b - a) * i / (count - 1))));
}

function stepMetrics(points, finalValue) {
  const low = .1 * finalValue, high = .9 * finalValue;
  let t10 = null, t90 = null, lastOutside = -1, peak = points[0];
  points.forEach((p, i) => {
    if (t10 === null && p.y >= low) t10 = p.x;
    if (t90 === null && p.y >= high) t90 = p.x;
    if (Math.abs(p.y - finalValue) > .02 * Math.abs(finalValue)) lastOutside = i;
    if (p.y > peak.y) peak = p;
  });
  const settleIndex = Math.min(lastOutside + 1, points.length - 1);
  return {rise: t10 !== null && t90 !== null ? t90 - t10 : null, settle: points[settleIndex].x, peak};
}

function firstOrderStep(k, tau, count = 601, fixedTime = null) {
  const tMax = fixedTime ?? 6 * tau;
  return Array.from({length: count}, (_, i) => {
    const t = tMax * i / (count - 1);
    return {x: t, y: k * (1 - Math.exp(-t / tau))};
  });
}

function secondOrderStep(k, zeta, wn, count = 901, fixedTime = null) {
  const slowRate = zeta > 1 ? wn * (zeta - Math.sqrt(zeta * zeta - 1)) : Math.max(zeta * wn, .04 * wn);
  const tMax = fixedTime ?? Math.min(60, Math.max(6 / wn, 8 / slowRate));
  return Array.from({length: count}, (_, i) => {
    const t = tMax * i / (count - 1);
    let normalized;
    if (zeta < .9995) {
      const root = Math.sqrt(1 - zeta * zeta), wd = wn * root;
      normalized = 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / root * Math.sin(wd * t));
    } else if (zeta <= 1.0005) {
      normalized = 1 - Math.exp(-wn * t) * (1 + wn * t);
    } else {
      const root = Math.sqrt(zeta * zeta - 1);
      const r1 = -wn * (zeta - root), r2 = -wn * (zeta + root);
      normalized = 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
    }
    return {x: t, y: k * normalized};
  });
}

function secondOrderImpulseAt(t, k, zeta, wn) {
  if (zeta < .9995) {
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    return k * wn * wn * Math.exp(-zeta * wn * t) * Math.sin(wd * t) / wd;
  }
  if (zeta <= 1.0005) return k * wn * wn * t * Math.exp(-wn * t);
  const root = Math.sqrt(zeta * zeta - 1), r1 = -wn * (zeta - root), r2 = -wn * (zeta + root);
  return k * wn * wn * (Math.exp(r1 * t) - Math.exp(r2 * t)) / (r1 - r2);
}

function responseWithZero(base, k, zeta, wn, zeroMagnitude, sign) {
  if (sign === 0) return base.map((point) => ({...point}));
  return base.map((point) => ({x: point.x, y: point.y + sign * secondOrderImpulseAt(point.x, k, zeta, wn) / zeroMagnitude}));
}

function rampFromStep(stepPoints) {
  let area = 0;
  return stepPoints.map((p, i) => {
    if (i > 0) area += .5 * (p.y + stepPoints[i - 1].y) * (p.x - stepPoints[i - 1].x);
    return {x: p.x, y: area};
  });
}

function firstBode(k, tau) {
  return logSamples(.01 / tau, 100 / tau, 260, (w) => ({
    w,
    mag: 20 * Math.log10(k / Math.sqrt(1 + (w * tau) ** 2)),
    phase: -Math.atan(w * tau) * 180 / Math.PI,
  }));
}

function firstNyquist(k, tau) {
  return logSamples(.0001 / tau, 1000 / tau, 320, (w) => {
    const q = w * tau, denominator = 1 + q * q;
    return {re: k / denominator, im: -k * q / denominator};
  });
}

function secondFrequency(k, zeta, wn) {
  return logSamples(.01 * wn, 100 * wn, 320, (w) => {
    const realDen = wn * wn - w * w, imagDen = 2 * zeta * wn * w;
    const denominator = realDen * realDen + imagDen * imagDen;
    const re = k * wn * wn * realDen / denominator;
    const im = -k * wn * wn * imagDen / denominator;
    return {w, re, im, mag: 20 * Math.log10(Math.hypot(re, im)), phase: Math.atan2(im, re) * 180 / Math.PI};
  });
}

function secondPoles(zeta, wn) {
  if (zeta < 1) {
    const imag = wn * Math.sqrt(1 - zeta * zeta);
    return [{re: -zeta * wn, im: imag}, {re: -zeta * wn, im: -imag}];
  }
  const root = Math.sqrt(Math.max(0, zeta * zeta - 1));
  return [{re: -wn * (zeta - root), im: 0}, {re: -wn * (zeta + root), im: 0}];
}

function formatPole(poles) {
  if (Math.abs(poles[0].im) < 1e-8) {
    if (Math.abs(poles[0].re - poles[1].re) < 1e-6) return `${poles[0].re.toFixed(2)} (double)`;
    return `${poles[0].re.toFixed(2)}, ${poles[1].re.toFixed(2)}`;
  }
  return `${poles[0].re.toFixed(2)} ± j${Math.abs(poles[0].im).toFixed(2)}`;
}

function currentRadio(name) {
  return $(`input[name="${name}"]:checked`).value;
}

function updateFirst() {
  const k = Number($('#f-gain').value), tau = Number($('#f-tau').value), pole = -1 / tau;
  const inputType = currentRadio('f-input');
  const step = firstOrderStep(k, tau, 601, 10), display = inputType === 'step' ? step : rampFromStep(step);
  $('#f-eq-k').textContent = k.toFixed(2); $('#f-eq-tau').textContent = tau.toFixed(2);
  $('#f-pole-text').textContent = pole.toFixed(2); $('#f-pole-chip').textContent = pole.toFixed(2);
  $('#f-metric-tau').textContent = `${tau.toFixed(2)} s`;
  $('#f-metric-rise').textContent = `${(Math.log(9) * tau).toFixed(2)} s`;
  $('#f-metric-settle').textContent = `${(-Math.log(.02) * tau).toFixed(2)} s`;
  $('#f-metric-gain').textContent = k.toFixed(2); $('#f-corner').textContent = `ωc = ${(1 / tau).toFixed(2)} rad/s`;
  $('#f-time-title').textContent = inputType === 'step' ? 'Unit step response' : 'Unit ramp response';
  drawTimePlot($('#f-time'), display, inputType, {
    finalValue: k,
    yMin: inputType === 'step' ? -.15 : -.5,
    yMax: inputType === 'step' ? 3.35 : 30,
    timeMarkers: [{x: tau, y: k * (1 - Math.exp(-1)), label: `τ = ${tau.toFixed(2)} s · 63.2%`}],
  });
  drawPolePlot($('#f-poles'), [{re: pole, im: 0}]);
  const corner = 1 / tau;
  drawBodePlot($('#f-bode'), firstBode(k, tau), [{
    w: corner, mag: 20 * Math.log10(k / Math.SQRT2), phase: -45, line: true,
    label: 'ωc · −3 dB · −45°', color: theme().amber,
  }]);
  drawNyquistPlot($('#f-nyquist'), firstNyquist(k, tau));
}

function updateSecond() {
  const k = Number($('#s-gain').value), zeta = Number($('#s-zeta').value), wn = Number($('#s-wn').value);
  const inputType = currentRadio('s-input');
  const metricStep = secondOrderStep(k, zeta, wn);
  const step = secondOrderStep(k, zeta, wn, 901, 10), display = inputType === 'step' ? step : rampFromStep(step);
  const metrics = stepMetrics(metricStep, k), poles = secondPoles(zeta, wn);
  let regime, regimeNote, modelNote;
  if (zeta < 1) { regime = 'Underdamped'; regimeNote = '0 < ζ < 1'; modelNote = 'The poles form an underdamped complex pair. Damping controls overshoot while natural frequency sets the time scale.'; }
  else if (Math.abs(zeta - 1) < .005) { regime = 'Critically damped'; regimeNote = 'ζ = 1'; modelNote = 'The two poles coincide. This is the fastest non-oscillatory response for the standard second-order model.'; }
  else { regime = 'Overdamped'; regimeNote = 'ζ > 1'; modelNote = 'The poles are distinct and real. The pole closest to the imaginary axis dominates the slow response.'; }
  const overshoot = zeta < 1 ? 100 * Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) : 0;
  const peakTime = zeta < 1 ? Math.PI / (wn * Math.sqrt(1 - zeta * zeta)) : null;
  $('#s-eq-k').textContent = k.toFixed(2); $('#s-eq-zeta').textContent = zeta.toFixed(2); $('#s-eq-wn').textContent = wn.toFixed(2); $('#s-eq-wn-num').textContent = wn.toFixed(2); $('#s-eq-wn-den').textContent = wn.toFixed(2);
  $('#s-model-note').textContent = modelNote; $('#s-pole-chip').textContent = formatPole(poles);
  $('#s-metric-regime').textContent = regime; $('#s-metric-regime-note').textContent = regimeNote;
  $('#s-metric-rise').textContent = metrics.rise === null ? '—' : `${metrics.rise.toFixed(2)} s`;
  $('#s-metric-settle').textContent = `${metrics.settle.toFixed(2)} s`;
  $('#s-metric-os').textContent = `${overshoot.toFixed(1)}%`;
  $('#s-metric-peak').textContent = peakTime === null ? 'no oscillatory peak' : `peak at ${peakTime.toFixed(2)} s`;
  $('#s-time-title').textContent = inputType === 'step' ? 'Unit step response' : 'Unit ramp response';
  const displayPeak = step.reduce((best, point) => point.y > best.y ? point : best, step[0]);
  const decayTime = zeta < 1 ? 1 / (zeta * wn) : -1 / poles[0].re;
  const decayLabel = zeta < 1 ? `τe = 1/(ζωn) = ${decayTime.toFixed(2)} s` : `τdom = ${decayTime.toFixed(2)} s`;
  drawTimePlot($('#s-time'), display, inputType, {
    finalValue: k,
    peak: zeta < 1 ? displayPeak : null,
    peakLabel: peakTime === null ? '' : `tp = ${peakTime.toFixed(2)} s`,
    yMin: inputType === 'step' ? -.25 : -.5,
    yMax: inputType === 'step' ? 6 : 30,
    timeMarkers: [{x: decayTime, label: decayLabel, color: theme().blue}],
  });
  drawPolePlot($('#s-poles'), poles);
  const frequency = secondFrequency(k, zeta, wn);
  const frequencyPoint = (w) => {
    const realDen = wn * wn - w * w, imagDen = 2 * zeta * wn * w;
    const denominator = realDen * realDen + imagDen * imagDen;
    const re = k * wn * wn * realDen / denominator, im = -k * wn * wn * imagDen / denominator;
    return {w, mag: 20 * Math.log10(Math.hypot(re, im)), phase: Math.atan2(im, re) * 180 / Math.PI};
  };
  const bandwidthRatioSquared = 1 - 2 * zeta * zeta + Math.sqrt((2 * zeta * zeta - 1) ** 2 + 1);
  const bandwidth = wn * Math.sqrt(bandwidthRatioSquared), bandwidthPoint = frequencyPoint(bandwidth), wnPoint = frequencyPoint(wn);
  const bodeAnnotations = [
    {w: bandwidth, mag: bandwidthPoint.mag, phase: bandwidthPoint.phase, line: true, label: 'ωBW · −3 dB', color: theme().amber},
    {w: wn, mag: wnPoint.mag, phase: -90, line: false, label: 'ωn · −90°', color: theme().blue},
  ];
  if (zeta < Math.SQRT1_2) {
    const resonantFrequency = wn * Math.sqrt(1 - 2 * zeta * zeta), resonantPoint = frequencyPoint(resonantFrequency);
    bodeAnnotations.unshift({w: resonantFrequency, mag: resonantPoint.mag, phase: resonantPoint.phase, line: false, label: 'ωr · peak', color: theme().red});
    $('#s-resonance').textContent = `ωr ${resonantFrequency.toFixed(2)} · ωn ${wn.toFixed(2)} · ωBW ${bandwidth.toFixed(2)} rad/s`;
  } else {
    $('#s-resonance').textContent = `no resonance · ωn ${wn.toFixed(2)} · ωBW ${bandwidth.toFixed(2)} rad/s`;
  }
  drawBodePlot($('#s-bode'), frequency, bodeAnnotations); drawNyquistPlot($('#s-nyquist'), frequency);
}

function updateZero() {
  const type = currentRadio('z-type');
  const k = Number($('#s-gain').value), zeta = Number($('#s-zeta').value), wn = Number($('#s-wn').value);
  const ratio = Number($('#z-ratio-entry').value), zeroMagnitude = ratio * wn;
  const sign = type === 'lhp' ? 1 : type === 'rhp' ? -1 : 0;
  const zeroLocation = type === 'none' ? null : type === 'lhp' ? -zeroMagnitude : zeroMagnitude;
  const metricBase = secondOrderStep(k, zeta, wn), metricModified = responseWithZero(metricBase, k, zeta, wn, zeroMagnitude, sign);
  const base = secondOrderStep(k, zeta, wn, 901, 10), modified = responseWithZero(base, k, zeta, wn, zeroMagnitude, sign);
  const metrics = stepMetrics(metricModified, k);
  const maxValue = Math.max(...metricModified.map((p) => p.y)), minValue = Math.min(...metricModified.map((p) => p.y));
  const overshoot = Math.max(0, (maxValue - k) / k * 100), undershoot = Math.max(0, -minValue / k * 100);
  const poles = secondPoles(zeta, wn), signSymbol = type === 'rhp' ? '−' : '+';
  if (type === 'none') {
    $('#z-transfer').innerHTML = `<i>G</i><sub>0</sub>(<i>s</i>) = <span class="fraction"><b>${k.toFixed(2)} × ${wn.toFixed(2)}<sup>2</sup></b><b><i>s</i><sup>2</sup> + 2(${zeta.toFixed(2)})(${wn.toFixed(2)})<i>s</i> + ${wn.toFixed(2)}<sup>2</sup></b></span>`;
    $('#z-model-note').textContent = 'This is the standard constant-numerator model. Its transient measures are determined by the pole pair.';
    $('#z-insight').textContent = 'Baseline: the standard second-order formulas apply because the numerator is constant.';
    $('#z-relation').innerHTML = `<i>y</i><sub>z</sub>(<i>t</i>) = <i>y</i><sub>0</sub>(<i>t</i>)`;
  } else {
    $('#z-transfer').innerHTML = `<i>G</i><sub>z</sub>(<i>s</i>) = <span class="fraction"><b>${k.toFixed(2)} × ${wn.toFixed(2)}<sup>2</sup>(1 ${signSymbol} <i>s</i>/${zeroMagnitude.toFixed(2)})</b><b><i>s</i><sup>2</sup> + 2(${zeta.toFixed(2)})(${wn.toFixed(2)})<i>s</i> + ${wn.toFixed(2)}<sup>2</sup></b></span>`;
    $('#z-relation').innerHTML = `<i>y</i><sub>z</sub>(<i>t</i>) = <i>y</i><sub>0</sub>(<i>t</i>) ${signSymbol} <i>h</i><sub>0</sub>(<i>t</i>)/<i>z</i>`;
    if (type === 'rhp') {
      $('#z-model-note').textContent = 'The poles and DC gain stay fixed. A right-half-plane zero makes the output initially move in the wrong direction.';
      $('#z-insight').textContent = 'Inverse response: the RHP zero subtracts part of the impulse response and limits how quickly the output can move correctly.';
    } else if (ratio >= 5) {
      $('#z-model-note').textContent = 'The poles and DC gain stay fixed. A far left-half-plane zero has only a small effect on the visible transient.';
      $('#z-insight').textContent = 'The zero is far from the dominant poles, so the standard second-order response remains a useful approximation.';
    } else {
      $('#z-model-note').textContent = 'The poles and DC gain stay fixed. A nearby left-half-plane zero changes the modal weights and can increase overshoot.';
      $('#z-insight').textContent = 'Same poles, different performance: the standard overshoot formula is no longer valid because the numerator is not constant.';
    }
  }
  $('#z-metric-location').textContent = zeroLocation === null ? 'none' : zeroLocation.toFixed(2);
  $('#z-metric-location-note').textContent = type === 'none' ? 'constant numerator' : type === 'lhp' ? 'left half-plane' : 'right half-plane';
  $('#z-metric-rise').textContent = metrics.rise === null ? '—' : `${metrics.rise.toFixed(2)} s`;
  $('#z-metric-overshoot').textContent = `${overshoot.toFixed(1)}%`;
  $('#z-metric-undershoot').textContent = `${undershoot.toFixed(1)}%`;
  $('#z-metric-settle').textContent = `${metrics.settle.toFixed(2)} s`;
  $('#z-plane-label').textContent = zeroLocation === null ? 'no zero' : `zero ${zeroLocation.toFixed(2)}`;
  drawZeroTimePlot($('#z-time'), base, modified, k);
  drawPoleZeroPlot($('#z-plane'), poles, zeroLocation, wn);
}

function updateBuilder() {
  const model = currentRadio('b-model'), omega = Number($('#b-omega-entry').value);
  let point, samples, transferMarkup, substitutionMarkup;
  if (model === 'first') {
    const k = Number($('#f-gain').value), tau = Number($('#f-tau').value);
    const calculate = (w) => {
      const q = w * tau, denominator = 1 + q * q;
      const re = k / denominator, im = -k * q / denominator;
      return {w, re, im, mag: 20 * Math.log10(Math.hypot(re, im)), phase: Math.atan2(im, re) * 180 / Math.PI};
    };
    point = calculate(omega); samples = logSamples(.01, 100, 320, calculate);
    transferMarkup = `<i>G</i>(<i>s</i>) = <span class="fraction"><b>${k.toFixed(2)}</b><b>${tau.toFixed(2)}<i>s</i> + 1</b></span>`;
    substitutionMarkup = `<i>s</i> = j${omega.toFixed(2)}<br><i>G</i>(j<i>ω</i>) = ${k.toFixed(2)}/[1 + j(${tau.toFixed(2)})(${omega.toFixed(2)})]`;
  } else {
    const k = Number($('#s-gain').value), zeta = Number($('#s-zeta').value), wn = Number($('#s-wn').value);
    const calculate = (w) => {
      const realDen = wn * wn - w * w, imagDen = 2 * zeta * wn * w;
      const denominator = realDen * realDen + imagDen * imagDen;
      const re = k * wn * wn * realDen / denominator, im = -k * wn * wn * imagDen / denominator;
      return {w, re, im, mag: 20 * Math.log10(Math.hypot(re, im)), phase: Math.atan2(im, re) * 180 / Math.PI};
    };
    point = calculate(omega); samples = logSamples(.01, 100, 320, calculate);
    transferMarkup = `<i>G</i>(<i>s</i>) = <span class="fraction"><b>${k.toFixed(2)} × ${wn.toFixed(2)}<sup>2</sup></b><b><i>s</i><sup>2</sup> + 2(${zeta.toFixed(2)})(${wn.toFixed(2)})<i>s</i> + ${wn.toFixed(2)}<sup>2</sup></b></span>`;
    substitutionMarkup = `<i>s</i> = j${omega.toFixed(2)}<br><i>G</i>(j<i>ω</i>) = K<i>ω</i><span class="math-scripts"><sub>n</sub><sup>2</sup></span>/[(<i>ω</i><span class="math-scripts"><sub>n</sub><sup>2</sup></span>−<i>ω</i><sup>2</sup>) + j2<i>ζω</i><sub>n</sub><i>ω</i>]`;
  }
  const magnitude = Math.hypot(point.re, point.im), sign = point.im < 0 ? '−' : '+';
  $('#b-transfer').innerHTML = transferMarkup;
  $('#b-substitute').innerHTML = substitutionMarkup;
  $('#b-complex').textContent = `${point.re.toFixed(3)} ${sign} j${Math.abs(point.im).toFixed(3)}`;
  $('#b-magnitude').textContent = `${magnitude.toFixed(3)} = ${point.mag.toFixed(2)} dB`;
  $('#b-phase').textContent = `${point.phase.toFixed(1)}°`;
  $('#b-point-summary').textContent = `At ω = ${omega.toFixed(2)} rad/s, the same G(jω) gives two Bode coordinates and the highlighted Nyquist point.`;
  $('#b-vector-label').textContent = `|G| ${magnitude.toFixed(3)} · ∠ ${point.phase.toFixed(1)}°`;
  $('#b-frequency-label').textContent = `ω = ${omega.toFixed(2)} rad/s`;
  $('#b-nyquist-label').textContent = `ω = ${omega.toFixed(2)} rad/s`;
  const scale = Math.max(.25, ...samples.map((sample) => Math.hypot(sample.re, sample.im))) * 1.12;
  drawFrequencyVector($('#b-vector'), point, scale);
  drawBodePlot($('#b-bode'), samples, [{w: omega, mag: point.mag, phase: point.phase, line: true, label: 'selected ω', color: theme().red}]);
  drawNyquistPlot($('#b-nyquist'), samples, point);
}

function asymptoteSettings() {
  return {
    k: Math.max(.1, Number($('#a-gain-entry').value) || 1),
    integrator: $('#a-integrator-on').checked ? Number($('#a-integrator-order').value) : 0,
    differentiator: $('#a-differentiator-on').checked ? Number($('#a-differentiator-order').value) : 0,
    zero: $('#a-zero-on').checked ? Math.max(.1, Number($('#a-zero-entry').value) || 1) : null,
    pole: $('#a-pole-on').checked ? Math.max(.1, Number($('#a-pole-entry').value) || 1) : null,
    second: $('#a-second-on').checked,
    wn: Math.max(.1, Number($('#a-wn-entry').value) || 1),
    zeta: Math.max(.1, Number($('#a-zeta-entry').value) || .4),
    showExact: $('#a-show-exact').checked,
  };
}

function phaseTransition(w, corner, totalPhase) {
  const ratio = w / corner;
  if (ratio <= .1) return 0;
  if (ratio >= 10) return totalPhase;
  return totalPhase * (Math.log10(ratio) + 1) / 2;
}

function asymptoteResponse(settings) {
  return logSamples(.01, 1000, 501, (w) => {
    const power = settings.differentiator - settings.integrator;
    let exactMag = 20 * Math.log10(settings.k) + 20 * power * Math.log10(w);
    let asymMag = exactMag;
    let exactPhase = 90 * power, approxPhase = exactPhase;
    if (settings.zero !== null) {
      const ratio = w / settings.zero;
      exactMag += 10 * Math.log10(1 + ratio * ratio);
      asymMag += ratio > 1 ? 20 * Math.log10(ratio) : 0;
      exactPhase += Math.atan(ratio) * 180 / Math.PI;
      approxPhase += phaseTransition(w, settings.zero, 90);
    }
    if (settings.pole !== null) {
      const ratio = w / settings.pole;
      exactMag -= 10 * Math.log10(1 + ratio * ratio);
      asymMag -= ratio > 1 ? 20 * Math.log10(ratio) : 0;
      exactPhase -= Math.atan(ratio) * 180 / Math.PI;
      approxPhase += phaseTransition(w, settings.pole, -90);
    }
    if (settings.second) {
      const ratio = w / settings.wn;
      const real = 1 - ratio * ratio, imag = 2 * settings.zeta * ratio;
      exactMag -= 20 * Math.log10(Math.hypot(real, imag));
      if (ratio > 1) asymMag -= 40 * Math.log10(ratio);
      exactPhase -= Math.atan2(imag, real) * 180 / Math.PI;
      approxPhase += phaseTransition(w, settings.wn, -180);
    }
    return {w, exactMag, asymMag, exactPhase, approxPhase};
  });
}

function asymptoteCorners(settings) {
  const corners = [];
  if (settings.zero !== null) corners.push({w: settings.zero, name: 'first-order zero', symbol: 'ωz', delta: 20});
  if (settings.pole !== null) corners.push({w: settings.pole, name: 'first-order pole', symbol: 'ωp', delta: -20});
  if (settings.second) corners.push({w: settings.wn, name: 'second-order poles', symbol: 'ωn', delta: -40});
  return corners.sort((a, b) => a.w - b.w);
}

function drawConstructionCorners(ctx, box, corners, xMap) {
  const c = theme();
  corners.forEach((corner, index) => {
    const x = xMap(corner.w);
    ctx.save(); ctx.strokeStyle = 'rgba(255,181,71,.52)'; ctx.fillStyle = c.amber; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x, box.top); ctx.lineTo(x, box.bottom); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
    ctx.textAlign = x > box.right - 90 ? 'right' : 'left';
    ctx.fillText(`${corner.symbol} = ${niceNumber(corner.w)}`, x + (ctx.textAlign === 'right' ? -5 : 5), box.top + 5 + (index % 3) * 14);
    ctx.restore();
  });
}

function drawAsymptoteMagnitude(canvas, samples, corners, showExact) {
  const {ctx, width, height} = canvasContext(canvas), c = theme();
  const box = {left: 62, right: width - 18, top: 16, bottom: height - 42};
  const values = samples.flatMap((point) => showExact ? [point.exactMag, point.asymMag] : [point.asymMag]);
  let yMin = Math.floor(Math.min(0, ...values) / 20) * 20, yMax = Math.ceil(Math.max(0, ...values) / 20) * 20;
  if (yMin === yMax) { yMin -= 20; yMax += 20; }
  const xMap = (w) => mapLinear(Math.log10(w), -2, 3, box.left, box.right);
  const yMap = (value) => mapLinear(value, yMin, yMax, box.bottom, box.top);
  const xTicks = [.01, .1, 1, 10, 100, 1000], yTicks = [0, .25, .5, .75, 1].map((n) => yMin + n * (yMax - yMin));
  drawGrid(ctx, box, xTicks, yTicks, xMap, yMap, (w) => `10^${Math.round(Math.log10(w))}`, (v) => `${Math.round(v)}`);
  drawConstructionCorners(ctx, box, corners, xMap);
  drawSeries(ctx, samples.map((point) => ({x: point.w, y: point.asymMag})), xMap, yMap, c.amber, 2.5, [7, 5]);
  if (showExact) drawSeries(ctx, samples.map((point) => ({x: point.w, y: point.exactMag})), xMap, yMap, c.teal, 3);
  drawAxisLabels(ctx, width, height, 'angular frequency (rad/s)', 'magnitude (dB)');
}

function drawAsymptotePhase(canvas, samples, corners, showExact) {
  const {ctx, width, height} = canvasContext(canvas), c = theme();
  const box = {left: 62, right: width - 18, top: 16, bottom: height - 42};
  const values = samples.flatMap((point) => showExact ? [point.exactPhase, point.approxPhase] : [point.approxPhase]);
  let yMin = Math.floor(Math.min(0, ...values) / 90) * 90, yMax = Math.ceil(Math.max(0, ...values) / 90) * 90;
  if (yMin === yMax) { yMin -= 90; yMax += 90; }
  const xMap = (w) => mapLinear(Math.log10(w), -2, 3, box.left, box.right);
  const yMap = (value) => mapLinear(value, yMin, yMax, box.bottom, box.top);
  const xTicks = [.01, .1, 1, 10, 100, 1000], yTicks = [0, .25, .5, .75, 1].map((n) => yMin + n * (yMax - yMin));
  drawGrid(ctx, box, xTicks, yTicks, xMap, yMap, (w) => `10^${Math.round(Math.log10(w))}`, (v) => `${Math.round(v)}°`);
  drawConstructionCorners(ctx, box, corners, xMap);
  drawSeries(ctx, samples.map((point) => ({x: point.w, y: point.approxPhase})), xMap, yMap, c.blue, 2.5, [7, 5]);
  if (showExact) drawSeries(ctx, samples.map((point) => ({x: point.w, y: point.exactPhase})), xMap, yMap, c.teal, 3);
  drawAxisLabels(ctx, width, height, 'angular frequency (rad/s)', 'phase (degrees)');
}

function asymptoteFormula(settings) {
  const factors = [`${settings.k.toFixed(2)}`];
  if (settings.differentiator) factors.push(`<i>s</i><sup>${settings.differentiator}</sup>`);
  if (settings.integrator) factors.push(`<span class="fraction"><b>1</b><b><i>s</i><sup>${settings.integrator}</sup></b></span>`);
  if (settings.zero !== null) factors.push(`(1 + <i>s</i>/${settings.zero.toFixed(2)})`);
  if (settings.pole !== null) factors.push(`<span class="fraction"><b>1</b><b>1 + <i>s</i>/${settings.pole.toFixed(2)}</b></span>`);
  if (settings.second) factors.push(`<span class="fraction"><b>1</b><b>(<i>s</i>/${settings.wn.toFixed(2)})<sup>2</sup> + 2(${settings.zeta.toFixed(2)})(<i>s</i>/${settings.wn.toFixed(2)}) + 1</b></span>`);
  return `<i>G</i>(<i>s</i>) = ${factors.join(' · ')}`;
}

function asymptoteRule(settings) {
  const factorCount = (settings.integrator > 0) + (settings.differentiator > 0) + (settings.zero !== null) + (settings.pole !== null) + settings.second;
  if (factorCount === 0) return 'Gain moves the magnitude plot vertically without changing its slope or phase.';
  if (settings.integrator && factorCount === 1) return `Each integrator contributes −20 dB/dec and −90°. Order ${settings.integrator} gives −${20 * settings.integrator} dB/dec.`;
  if (settings.differentiator && factorCount === 1) return `Each differentiator contributes +20 dB/dec and +90°. Order ${settings.differentiator} gives +${20 * settings.differentiator} dB/dec.`;
  if (settings.second && factorCount === 1) return `The asymptote changes by −40 dB/dec at ωn. The exact curve depends strongly on ζ = ${settings.zeta.toFixed(2)}.`;
  if (settings.zero !== null && settings.pole !== null && factorCount === 2) return settings.zero < settings.pole ? 'Lead network: the zero raises the slope first, producing a positive phase contribution between the two corners.' : 'Lag network: the pole lowers the slope first, producing a negative phase contribution between the two corners.';
  return 'Add the magnitude contributions in dB and add the phase contributions. At each corner, update the running slope.';
}

function updateSlopeTable(settings, corners) {
  const body = $('#a-slope-body');
  let slope = 20 * (settings.differentiator - settings.integrator);
  const rows = [];
  if (!corners.length) rows.push(`<tr><td>all frequencies</td><td>no corner</td><td>—</td><td>${slope >= 0 ? '+' : ''}${slope} dB/dec</td></tr>`);
  else {
    rows.push(`<tr><td>ω &lt; ${niceNumber(corners[0].w)}</td><td>before first corner</td><td>—</td><td>${slope >= 0 ? '+' : ''}${slope} dB/dec</td></tr>`);
    const groups = [];
    corners.forEach((corner) => {
      const group = groups.find((item) => Math.abs(item.w - corner.w) < 1e-9);
      if (group) { group.items.push(corner); group.delta += corner.delta; }
      else groups.push({w: corner.w, items: [corner], delta: corner.delta});
    });
    groups.forEach((group) => {
      slope += group.delta;
      rows.push(`<tr><td>ω &gt; ${niceNumber(group.w)}</td><td>${group.items.map((item) => item.name).join(' + ')}</td><td>${group.delta > 0 ? '+' : ''}${group.delta} dB/dec</td><td>${slope >= 0 ? '+' : ''}${slope} dB/dec</td></tr>`);
    });
  }
  body.innerHTML = rows.join('');
}

function syncAsymptoteFactorState() {
  [['#a-integrator-on', '#a-integrator-order'], ['#a-differentiator-on', '#a-differentiator-order']].forEach(([check, control]) => {
    $(control).disabled = !$(check).checked; $(check).closest('.factor-switch').classList.toggle('is-off', !$(check).checked);
  });
  [['#a-zero-on', ['#a-zero-entry', '#a-zero']], ['#a-pole-on', ['#a-pole-entry', '#a-pole']], ['#a-second-on', ['#a-wn-entry', '#a-zeta-entry', '#a-wn', '#a-zeta']]].forEach(([check, controls]) => {
    controls.forEach((control) => { $(control).disabled = !$(check).checked; });
    $(check).closest('.factor-switch').classList.toggle('is-off', !$(check).checked);
  });
}

function updateAsymptote() {
  syncAsymptoteFactorState();
  const settings = asymptoteSettings(), samples = asymptoteResponse(settings), corners = asymptoteCorners(settings);
  $('#a-transfer').innerHTML = asymptoteFormula(settings);
  const reference = samples.reduce((best, point) => Math.abs(Math.log10(point.w)) < Math.abs(Math.log10(best.w)) ? point : best, samples[0]);
  const initialSlope = 20 * (settings.differentiator - settings.integrator);
  const finalSlope = initialSlope + corners.reduce((sum, corner) => sum + corner.delta, 0);
  $('#a-level').textContent = `${reference.asymMag.toFixed(2)} dB`;
  $('#a-initial-slope').textContent = `${initialSlope >= 0 ? '+' : ''}${initialSlope} dB/dec`;
  $('#a-final-slope').textContent = `${finalSlope >= 0 ? '+' : ''}${finalSlope} dB/dec`;
  $('#a-corners').textContent = corners.length ? corners.map((corner) => `${corner.symbol} ${niceNumber(corner.w)}`).join(' · ') : 'none';
  $('#a-rule').textContent = asymptoteRule(settings);
  $('#a-view-state').innerHTML = settings.showExact ? 'Exact response <i>solid</i> · asymptote <i>dashed</i>' : 'Practice mode · exact response hidden';
  updateSlopeTable(settings, corners);
  drawAsymptoteMagnitude($('#a-magnitude'), samples, corners, settings.showExact);
  drawAsymptotePhase($('#a-phase'), samples, corners, settings.showExact);
}

function selectSystem(system, updateHash = true) {
  const systems = {
    first: {tab: '#first-tab', panel: '#first-panel', hash: '#first-order', update: updateFirst},
    second: {tab: '#second-tab', panel: '#second-panel', hash: '#second-order', update: updateSecond},
    zero: {tab: '#zero-tab', panel: '#zero-panel', hash: '#zero-effect', update: updateZero},
    builder: {tab: '#builder-tab', panel: '#builder-panel', hash: '#bode-builder', update: updateBuilder},
    asymptote: {tab: '#asymptote-tab', panel: '#asymptote-panel', hash: '#bode-asymptote', update: updateAsymptote},
  };
  Object.entries(systems).forEach(([name, item]) => {
    const selected = name === system;
    $(item.tab).setAttribute('aria-selected', String(selected));
    $(item.panel).hidden = !selected;
  });
  if (updateHash) history.replaceState(null, '', systems[system].hash);
  requestAnimationFrame(systems[system].update);
}

$('#first-tab').addEventListener('click', () => selectSystem('first'));
$('#second-tab').addEventListener('click', () => selectSystem('second'));
$('#zero-tab').addEventListener('click', () => selectSystem('zero'));
$('#builder-tab').addEventListener('click', () => selectSystem('builder'));
$('#asymptote-tab').addEventListener('click', () => selectSystem('asymptote'));
const parameterBindings = [
  ['#f-gain', '#f-gain-entry', updateFirst, '#f-entry-status'],
  ['#f-tau', '#f-tau-entry', updateFirst, '#f-entry-status'],
  ['#s-gain', '#s-gain-entry', updateSecond, '#s-entry-status'],
  ['#s-zeta', '#s-zeta-entry', updateSecond, '#s-entry-status'],
  ['#s-wn', '#s-wn-entry', updateSecond, '#s-entry-status'],
];
parameterBindings.forEach(([sliderSelector, entrySelector, update, statusSelector]) => {
  $(sliderSelector).addEventListener('input', () => {
    $(entrySelector).value = Number($(sliderSelector).value).toFixed(2);
    $(statusSelector).textContent = '';
    update();
  });
});
$$('input[type="radio"][name="f-input"]').forEach((input) => input.addEventListener('input', updateFirst));
$$('input[type="radio"][name="s-input"]').forEach((input) => input.addEventListener('input', updateSecond));

function applyEntries(form, pairs, update, status) {
  if (!form.reportValidity()) return;
  pairs.forEach(([entrySelector, sliderSelector]) => {
    const entry = $(entrySelector), slider = $(sliderSelector);
    slider.value = entry.value;
    entry.value = Number(slider.value).toFixed(2);
  });
  $(status).textContent = 'Values applied.';
  update();
}

$('#f-controls').addEventListener('submit', (event) => {
  event.preventDefault();
  applyEntries(event.currentTarget, [['#f-gain-entry', '#f-gain'], ['#f-tau-entry', '#f-tau']], updateFirst, '#f-entry-status');
});
$('#s-controls').addEventListener('submit', (event) => {
  event.preventDefault();
  applyEntries(event.currentTarget, [['#s-gain-entry', '#s-gain'], ['#s-zeta-entry', '#s-zeta'], ['#s-wn-entry', '#s-wn']], updateSecond, '#s-entry-status');
});
$('#z-ratio').addEventListener('input', () => {
  $('#z-ratio-entry').value = (10 ** Number($('#z-ratio').value)).toFixed(2);
  updateZero();
});
$('#z-apply').addEventListener('click', () => {
  const entry = $('#z-ratio-entry');
  if (!entry.reportValidity()) return;
  $('#z-ratio').value = Math.log10(Number(entry.value));
  entry.value = Number(entry.value).toFixed(2);
  updateZero();
});
$('#z-ratio-entry').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); $('#z-apply').click(); }
});
$$('input[type="radio"][name="z-type"]').forEach((input) => input.addEventListener('input', updateZero));
$$('[data-zero-preset]').forEach((button) => button.addEventListener('click', () => {
  const preset = button.dataset.zeroPreset;
  const settings = {
    none: {type: 'none'},
    far: {type: 'lhp', ratio: 8},
    near: {type: 'lhp', ratio: 1},
    rhp: {type: 'rhp', ratio: 1},
  }[preset];
  $(`input[name="z-type"][value="${settings.type}"]`).checked = true;
  if (settings.ratio) {
    $('#z-ratio').value = Math.log10(settings.ratio);
    $('#z-ratio-entry').value = settings.ratio.toFixed(2);
  }
  updateZero();
}));
$('#b-omega').addEventListener('input', () => {
  $('#b-omega-entry').value = (10 ** Number($('#b-omega').value)).toFixed(2);
  updateBuilder();
});
$('#b-apply').addEventListener('click', () => {
  const entry = $('#b-omega-entry');
  if (!entry.reportValidity()) return;
  $('#b-omega').value = Math.log10(Number(entry.value));
  entry.value = Number(entry.value).toFixed(2);
  updateBuilder();
});
$('#b-omega-entry').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); $('#b-apply').click(); }
});
$$('input[type="radio"][name="b-model"]').forEach((input) => input.addEventListener('input', updateBuilder));
const asymptotePresets = {
  gain: {k: 2},
  integrator: {k: 1, integrator: 1},
  differentiator: {k: 1, differentiator: 1},
  pole: {k: 1, pole: 1},
  zero: {k: 1, zero: 1},
  second: {k: 1, second: true, wn: 2, zeta: .4},
  lead: {k: 1, zero: 1, pole: 10},
  lag: {k: 1, pole: 1, zero: 10},
  pi: {k: 1, integrator: 1, zero: 1},
};
function setAsymptoteLogPair(entrySelector, sliderSelector, value) {
  $(entrySelector).value = Number(value).toFixed(2); $(sliderSelector).value = Math.log10(Number(value));
}
function applyAsymptotePreset(name) {
  if (name === 'custom') { updateAsymptote(); return; }
  const preset = asymptotePresets[name];
  setAsymptoteLogPair('#a-gain-entry', '#a-gain', preset.k ?? 1);
  $('#a-integrator-on').checked = Boolean(preset.integrator); $('#a-integrator-order').value = preset.integrator ?? 1;
  $('#a-differentiator-on').checked = Boolean(preset.differentiator); $('#a-differentiator-order').value = preset.differentiator ?? 1;
  $('#a-zero-on').checked = preset.zero !== undefined; setAsymptoteLogPair('#a-zero-entry', '#a-zero', preset.zero ?? 1);
  $('#a-pole-on').checked = preset.pole !== undefined; setAsymptoteLogPair('#a-pole-entry', '#a-pole', preset.pole ?? 10);
  $('#a-second-on').checked = Boolean(preset.second); setAsymptoteLogPair('#a-wn-entry', '#a-wn', preset.wn ?? 2);
  $('#a-zeta-entry').value = Number(preset.zeta ?? .4).toFixed(2); $('#a-zeta').value = preset.zeta ?? .4;
  updateAsymptote();
}
$('#a-preset').addEventListener('change', () => applyAsymptotePreset($('#a-preset').value));
[['#a-gain', '#a-gain-entry'], ['#a-zero', '#a-zero-entry'], ['#a-pole', '#a-pole-entry'], ['#a-wn', '#a-wn-entry']].forEach(([sliderSelector, entrySelector]) => {
  $(sliderSelector).addEventListener('input', () => {
    $(entrySelector).value = (10 ** Number($(sliderSelector).value)).toFixed(2); $('#a-preset').value = 'custom'; updateAsymptote();
  });
  $(entrySelector).addEventListener('change', () => {
    if (!$(entrySelector).reportValidity()) return;
    $(sliderSelector).value = Math.log10(Number($(entrySelector).value)); $(entrySelector).value = Number($(entrySelector).value).toFixed(2); $('#a-preset').value = 'custom'; updateAsymptote();
  });
});
$('#a-zeta').addEventListener('input', () => { $('#a-zeta-entry').value = Number($('#a-zeta').value).toFixed(2); $('#a-preset').value = 'custom'; updateAsymptote(); });
$('#a-zeta-entry').addEventListener('change', () => { if (!$('#a-zeta-entry').reportValidity()) return; $('#a-zeta').value = $('#a-zeta-entry').value; $('#a-zeta-entry').value = Number($('#a-zeta-entry').value).toFixed(2); $('#a-preset').value = 'custom'; updateAsymptote(); });
$$('#a-controls input[type="checkbox"]:not(#a-show-exact), #a-controls select:not(#a-preset)').forEach((control) => control.addEventListener('change', () => { $('#a-preset').value = 'custom'; updateAsymptote(); }));
$('#a-show-exact').addEventListener('change', updateAsymptote);
$$('.reset-button').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.reset === 'first') {
    $('#f-gain').value = 1; $('#f-tau').value = 1; $('#f-gain-entry').value = '1.00'; $('#f-tau-entry').value = '1.00'; $('#f-entry-status').textContent = ''; $('input[name="f-input"][value="step"]').checked = true; updateFirst();
  } else {
    $('#s-gain').value = 1; $('#s-zeta').value = .4; $('#s-wn').value = 2; $('#s-gain-entry').value = '1.00'; $('#s-zeta-entry').value = '0.40'; $('#s-wn-entry').value = '2.00'; $('#s-entry-status').textContent = ''; $('input[name="s-input"][value="step"]').checked = true; updateSecond();
  }
}));

let resizeFrame;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (!$('#first-panel').hidden) updateFirst();
    else if (!$('#second-panel').hidden) updateSecond();
    else if (!$('#zero-panel').hidden) updateZero();
    else if (!$('#builder-panel').hidden) updateBuilder();
    else updateAsymptote();
  });
}).observe($('#workspace'));

selectSystem(location.hash === '#second-order' ? 'second' : location.hash === '#zero-effect' ? 'zero' : location.hash === '#bode-builder' ? 'builder' : location.hash === '#bode-asymptote' ? 'asymptote' : 'first', false);
