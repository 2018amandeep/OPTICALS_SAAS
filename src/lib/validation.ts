/**
 * Helper to validate Ocular testing values (SPH, CYL, AXIS, VSN)
 */
export function validatePrescription(prescription: any): string | null {
  const right = prescription?.right || {};
  const left = prescription?.left || {};

  const fields = [
    { val: right.sph, min: -20, max: 10, label: 'Right Eye SPH' },
    { val: right.cyl, min: -6, max: 0, label: 'Right Eye CYL' },
    { val: left.sph, min: -20, max: 10, label: 'Left Eye SPH' },
    { val: left.cyl, min: -6, max: 0, label: 'Left Eye CYL' }
  ];

  for (const f of fields) {
    if (f.val && String(f.val).trim() !== '') {
      const num = parseFloat(f.val);
      if (isNaN(num)) {
        return `${f.label} must be a valid number (e.g. -1.25 or +2.00)`;
      }
      if (num < f.min || num > f.max) {
        return `${f.label} must be between ${f.min} and ${f.max}`;
      }
    }
  }

  const addFields = [
    { val: right.add, min: 0.5, max: 4.0, label: 'Right Eye ADD' },
    { val: left.add, min: 0.5, max: 4.0, label: 'Left Eye ADD' }
  ];

  for (const f of addFields) {
    if (f.val && String(f.val).trim() !== '') {
      const num = parseFloat(f.val);
      if (isNaN(num)) {
        return `${f.label} must be a valid number (e.g. +1.50)`;
      }
      if (num < f.min || num > f.max) {
        return `${f.label} must be between +${f.min.toFixed(2)} and +${f.max.toFixed(2)}`;
      }
    }
  }

  const axes = [
    { val: right.axis, label: 'Right Eye AXIS' },
    { val: left.axis, label: 'Left Eye AXIS' }
  ];

  for (const a of axes) {
    if (a.val && String(a.val).trim() !== '') {
      const num = parseInt(a.val, 10);
      if (isNaN(num) || num < 0 || num > 180) {
        return `${a.label} must be an integer between 0 and 180`;
      }
    }
  }

  return null;
}

/**
 * Helper to validate Interpupillary Distance (IPD) values
 * Standard IPD ranges between 40mm and 80mm
 */
export function validateIpd(val: string): string | null {
  if (!val || String(val).trim() === '') return null;
  
  const numbers = val.match(/\d+/g);
  if (!numbers) {
    return 'I.P.D. must contain numbers (e.g. 63mm or 60-64)';
  }
  
  for (const n of numbers) {
    const num = parseInt(n, 10);
    if (num < 40 || num > 80) {
      return 'I.P.D. value must be between 40mm and 80mm';
    }
  }
  
  return null;
}
