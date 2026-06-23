const bcrypt = require('bcryptjs');

// Hash a password
const password = 'hansco123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verify the hash
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error comparing password:', err);
      return;
    }
    console.log('Password match:', result);
  });
});

// Or use async/await
async function hashPassword() {
  try {
    const hash = await bcrypt.hash('hansco123', 10);
    console.log('Async hash:', hash);
    
    const isValid = await bcrypt.compare('hansco123', hash);
    console.log('Async verification:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();
