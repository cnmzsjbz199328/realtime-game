// 测试 Vector API 注入
import { HeadlessSandbox } from './core/sandbox';

const testCode = `
const init = (state, w, h) => {
  console.log('Testing Vector API...');
  
  // Test constructor
  const v1 = new Vector(3, 4);
  console.log('Constructor works:', v1.x, v1.y);
  
  // Test static methods
  try {
    const v2 = new Vector(1, 2);
    const result = Vector.mult(v1, 2);
    console.log('Vector.mult works:', result.x, result.y);
    
    const sum = Vector.add(v1, v2);
    console.log('Vector.add works:', sum.x, sum.y);
    
    const mag = Vector.mag(v1);
    console.log('Vector.mag works:', mag);
    
    const rotated = Vector.rotate(v1, Math.PI / 2);
    console.log('Vector.rotate works:', rotated.x, rotated.y);
    
    console.log('✅ All Vector static methods work!');
  } catch (e) {
    console.error('❌ Vector static method failed:', e.message);
  }
  
  state.test = 'done';
};

const update = (state, input, dt, w, h) => {
  // Test in update
  try {
    const v = new Vector(1, 0);
    const scaled = Vector.mult(v, 5);
    state.scaled = scaled;
  } catch (e) {
    console.error('Update error:', e.message);
  }
};

const draw = (state, ctx, w, h) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
};

return { init, update, draw };
`;

console.log('=== Vector API Injection Test ===\n');

const sandbox = new HeadlessSandbox(testCode);
const result = sandbox.run(10);

console.log('Success:', result.success);
console.log('\nLogs:');
result.logs.forEach(log => console.log('  ', log));

if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(err => console.log('  ', err));
} else {
    console.log('\n✅ No errors!');
}
