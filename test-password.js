const bcrypt = require('bcryptjs');

const hash = '$2b$10$g8TfOZjj0VfQtFn0NYJlYe2O0NDvShr2PEtQuKY9Bgag0McwsgtQ2';

console.log('Testing password hashes:');
console.log('Admin@123:', bcrypt.compareSync('Admin@123', hash));
console.log('admin@123:', bcrypt.compareSync('admin@123', hash));
console.log('Admin123:', bcrypt.compareSync('Admin123', hash));
console.log('admin123:', bcrypt.compareSync('admin123', hash));

// Also generate a new hash for Admin@123 to compare
const newHash = bcrypt.hashSync('Admin@123', 10);
console.log('\nNew hash for Admin@123:', newHash);
console.log('New hash matches Admin@123:', bcrypt.compareSync('Admin@123', newHash));
