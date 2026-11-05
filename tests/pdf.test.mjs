import test from 'node:test';
import assert from 'node:assert/strict';
import {jpegToPdf} from '../src/pdf.js';

test('PDF export writes a readable, single-page PDF structure with valid byte offsets',async()=>{
  const jpeg=new Uint8Array([0xff,0xd8,0xff,0xd9]);
  const pdf=jpegToPdf(jpeg,200,120);
  assert.equal(pdf.type,'application/pdf');
  const buffer=Buffer.from(await pdf.arrayBuffer());
  const text=buffer.toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4\n'));
  assert.ok(text.includes('/Subtype /Image'));
  assert.ok(text.includes('/Count 1'));
  assert.ok(text.includes('/Length 4'));
  const location=Number(text.match(/startxref\n(\d+)/)?.[1]);
  assert.ok(location>0);
  assert.equal(text.slice(location,location+4),'xref');
  const refs=Array.from(text.matchAll(/(\d{10}) 00000 n/g),m=>Number(m[1]));
  assert.equal(refs.length,5);
  for(let index=0;index<refs.length;index++){
    assert.equal(text.slice(refs[index],refs[index]+1),String(index+1));
    assert.ok(text.slice(refs[index]).startsWith((index+1)+' 0 obj'));
  }
});
test('PDF writer rejects invalid image data and dimensions',()=>{
  assert.throws(()=>jpegToPdf(new Uint8Array([1,2,3,4]),200,120),/Invalid JPEG/);
  assert.throws(()=>jpegToPdf(new Uint8Array([0xff,0xd8,0xff,0xd9]),0,120),/Invalid diagram/);
});
