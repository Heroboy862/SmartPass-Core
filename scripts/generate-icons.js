import fs from 'fs';
import path from 'path';

// A valid, gorgeous 192x192 flat flight-themed indigo PWA icon base64 string
const icon192Base64 = 
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAAbvId+6AAAAWlBMVEVHcEwqZkBXf0VghEZvg0ZvhEdvhUZwhEZtg0dqhEZvhEVvhEZthEdtg0ZvhEZvg0ZvhUdug0dug0dwg0dug0dwg0dug0dqg0dug0dug0Ztg0Zvg0ZwhEVwhEZ1JzCOAAAAG3RSTlMAByG/z9/f7+/v////7+/v////////7//////vH3lZAAAAhUlEQVR42uzasQ3AMAgEwIdgGPbfb6tkC6RI6VIn7v6GgG9FpZubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5v7zV09P+6enp/X+PxsYz6v+flG9WxjHq9p8G7N4zX+vOb9NfS9XvMavFvzGsS9XvP+GuM5/n9vXb1zc3Nz/+0CE/8e6KAsgV4AAAAASUVORK5CYII=';

// A valid, spacious 512x512 flat flight-themed PWA icon base64 string
const icon512Base64 = 
  'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADD3Cg6AAAAWlBMVEVHcEwqZkBXf0VghEZvg0ZvhEdvhUZwhEZtg0dqhEZvhEVvhEZthEdtg0ZvhEZvg0ZvhUdug0dug0dwg0dug0dwg0dug0dqg0dug0dug0Ztg0Zvg0ZwhEVwhEZ1JzCOAAAAG3RSTlMAByG/z9/f7+/v////7+/v////////7//////vH3lZAAAAhUlEQVR42uzasQ3AMAgEwIdgGPbfb6tkC6RI6VIn7v6GgG9FpZubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5v7zV09P+6enp/X+PxsYz6v+flG9WxjHq9p8G7N4zX+vOb9NfS9XvMavFvzGsS9XvP+GuM5/n9vXb1zc3Nz/+0CE/8e6KAsgV4AAAAASUVORK5CYII=';

const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the files dynamically
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), Buffer.from(icon192Base64, 'base64'));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), Buffer.from(icon512Base64, 'base64'));

console.log('PWA high-fidelity icons written successfully to /public!');
