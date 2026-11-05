/**
 * Minimal, dependency-free PDF writer for a single printable JPEG diagram page.
 * All offsets are measured in UTF-8 bytes, not JS string indices.
 * The diagram is rasterized at export resolution by the caller.
 */
const utf8 = value => new TextEncoder().encode(value);

export function jpegToPdf(jpeg,width,height) {
  if(!(jpeg instanceof Uint8Array)||jpeg.length<4||jpeg[0]!==0xff||jpeg[1]!==0xd8)
    throw new Error('Invalid JPEG image for PDF export.');
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
    throw new Error('Invalid diagram dimensions.');
  const landscape=width>=height,pageW=landscape?842:595,pageH=landscape?595:842;
  const margin=28;
  const scale=Math.min((pageW-2*margin)/width,(pageH-2*margin)/height);
  const drawW=+(width*scale).toFixed(3),drawH=+(height*scale).toFixed(3);
  const drawX=+((pageW-drawW)/2).toFixed(3),drawY=+((pageH-drawH)/2).toFixed(3);
  const content=`q\n${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm\n/Im0 Do\nQ\n`;
  const chunks=[],offsets=[0];let total=0;
  const append=part=>{const data=typeof part==='string'?utf8(part):part;chunks.push(data);total+=data.length;};
  const begin=n=>{offsets[n]=total;append(`${n} 0 obj\n`);};
  const end=()=>append('\nendobj\n');
  append('%PDF-1.4\n');
  begin(1);append('<< /Type /Catalog /Pages 2 0 R >>');end();
  begin(2);append('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');end();
  begin(3);append(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);end();
  begin(4);
  append(`<< /Type /XObject /Subtype /Image /Width ${Math.round(width)} /Height ${Math.round(height)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  append(jpeg);append('\nendstream');end();
  begin(5);append(`<< /Length ${utf8(content).length} >>\nstream\n`);append(content);append('endstream');end();
  const xref=total;
  append('xref\n0 6\n0000000000 65535 f \n');
  for(let n=1;n<=5;n++)append(String(offsets[n]).padStart(10,'0')+' 00000 n \n');
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks,{type:'application/pdf'});
}
