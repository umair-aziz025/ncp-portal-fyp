# Custom Domain Email Setup (GitHub Education Pack)

## Why This Fixes Spam Issues

1. **Professional Domain**: `noreply@yourdomain.com` instead of Gmail
2. **Email Authentication**: SPF, DKIM, DMARC records prove legitimacy
3. **Sender Reputation**: Custom domain builds trust with email providers
4. **Compliance**: Follows email best practices

---

## Step 1: Get Free Domain (GitHub Education Pack)

### Option A: Namecheap (Recommended)
1. Go to [GitHub Education Pack](https://education.github.com/pack)
2. Click "Namecheap" → Get 1 year free domain + SSL
3. Register domain (e.g., `yourportal.com`, `eduportal.tech`, etc.)

### Option B: Name.com
1. Same process via GitHub Education Pack
2. Get 1 year free `.me` domain

**Domain Suggestions:**
- `eduportal.tech`
- `campusconnect.online`
- `studenthub.site`
- `yourname-portal.com`

---

## Step 2: Configure SendGrid Email Authentication

### A. Verify Your Domain in SendGrid

1. Login to [SendGrid](https://app.sendgrid.com)
2. Go to **Settings** → **Sender Authentication**
3. Click **Authenticate Your Domain**
4. Choose **DNS Host**: Select your domain provider (Namecheap/Name.com)
5. Enter your domain: `yourdomain.com`
6. Check: "I also want to brand my links" ✓

SendGrid will generate DNS records (CNAME records):

```
Record Type: CNAME
Host: em123.yourdomain.com
Value: u12345.wl.sendgrid.net

Record Type: CNAME  
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u12345.wl.sendgrid.net

Record Type: CNAME
Host: s2._domainkey.yourdomain.com  
Value: s2.domainkey.u12345.wl.sendgrid.net
```

### B. Add DNS Records to Your Domain

**For Namecheap:**
1. Login to Namecheap
2. Go to **Domain List** → Click your domain → **Advanced DNS**
3. Click **Add New Record**
4. Add ALL CNAME records from SendGrid:
   - Type: CNAME Record
   - Host: Copy from SendGrid (e.g., `em123`)
   - Value: Copy from SendGrid
   - TTL: Automatic

**For Name.com:**
1. Login to Name.com
2. Go to **My Domains** → Click domain → **DNS Records**
3. Add CNAME records same as above

### C. Verify Domain in SendGrid

1. Wait 10-15 minutes for DNS propagation
2. In SendGrid, click **Verify** next to your domain
3. Status should change to **Verified** ✓

---

## Step 3: Configure SPF Record (Anti-Spoofing)

**What is SPF?** Specifies which mail servers can send emails from your domain.

Add this TXT record to your domain DNS:

```
Record Type: TXT
Host: @
Value: v=spf1 include:sendgrid.net ~all
TTL: Automatic
```

**For Namecheap/Name.com:**
- Add new record → Type: TXT
- Host: `@` (represents root domain)
- Value: `v=spf1 include:sendgrid.net ~all`

---

## Step 4: Configure DMARC (Email Policy)

**What is DMARC?** Tells receiving servers what to do with emails that fail authentication.

Add this TXT record:

```
Record Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
TTL: Automatic
```

**Explanation:**
- `p=none` = Monitor only (start with this)
- `rua=mailto:...` = Receive DMARC reports at this email

---

## Step 5: Create Verified Sender with Custom Domain

1. In SendGrid, go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in:
   - From Name: `Campus Portal` or `Student Portal`
   - From Email: `noreply@yourdomain.com`
   - Reply To: `support@yourdomain.com` (or your existing email)
   - Company Address: Your institution address
4. Click **Create**
5. SendGrid sends verification email to `noreply@yourdomain.com`

---

## Step 6: Setup Email Forwarding (Cloudflare - Free)

**Problem:** You don't have a mailbox for `noreply@yourdomain.com` to receive verification email.

**Solution:** Forward domain emails to your Gmail using Cloudflare Email Routing (FREE):

### A. Add Domain to Cloudflare

1. Go to [Cloudflare](https://cloudflare.com) → Add Site
2. Enter your domain → Select Free plan
3. Cloudflare shows you nameserver addresses (e.g., `zara.ns.cloudflare.com`)

### B. Update Nameservers

**In Namecheap:**
1. Go to Domain List → Your Domain → **Nameservers**
2. Select **Custom DNS**
3. Add Cloudflare nameservers (2 addresses)
4. Wait 5-30 minutes for propagation

**In Name.com:**
1. Same process in DNS settings

### C. Enable Email Routing in Cloudflare

1. In Cloudflare dashboard → **Email** → **Email Routing**
2. Click **Get Started** (FREE feature)
3. Add destination email: `your-actual-email@gmail.com`
4. Verify by clicking link sent to your Gmail
5. Create routing rule:
   - Catch-all: `*@yourdomain.com` → Forward to `your-actual-email@gmail.com`
   - OR Specific: `noreply@yourdomain.com` → Forward to `your-actual-email@gmail.com`

### D. Complete SendGrid Verification

1. SendGrid sends email to `noreply@yourdomain.com`
2. Cloudflare forwards it to your Gmail
3. Click verification link
4. Sender verified! ✓

---

## Step 7: Update Cloud Functions with Custom Domain Email

Update `functions/src/index.ts`:

```typescript
// Change sender email from Gmail to custom domain
const msg = {
  to: recipientEmail,
  from: {
    email: 'noreply@yourdomain.com',  // ← Your custom domain
    name: 'Campus Portal Notifications'
  },
  replyTo: 'support@yourdomain.com',  // ← Optional: reply address
  subject: 'Notification Subject',
  html: emailHtml
};
```

Deploy changes:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

---

## Step 8: Test Email Deliverability

1. Create a test notification or feedback in your portal
2. Check your inbox (NOT spam folder)
3. Verify:
   - ✓ Email arrives in inbox
   - ✓ From shows: `Campus Portal <noreply@yourdomain.com>`
   - ✓ No spam warnings
   - ✓ Links work correctly

---

## GitHub Education Pack Benefits for This Project

| Service | Benefit | Use Case |
|---------|---------|----------|
| **Namecheap** | Free domain + SSL (1 year) | Custom email domain |
| **Cloudflare** | Free email routing | Forward emails to Gmail |
| **SendGrid** | 100,000+ emails/month | Better than free tier |
| **DigitalOcean** | $200 credit | Host production app |
| **MongoDB Atlas** | $50 credit | If you need database |

---

## Timeline

- **Domain Purchase**: 5 minutes
- **DNS Configuration**: 10 minutes
- **DNS Propagation**: 10-30 minutes (wait time)
- **Cloudflare Setup**: 10 minutes
- **SendGrid Configuration**: 15 minutes
- **Testing**: 5 minutes

**Total**: ~1 hour (mostly waiting for DNS)

---

## Quick Setup Checklist

- [ ] Get free domain from Namecheap (GitHub Education Pack)
- [ ] Add domain to Cloudflare (free plan)
- [ ] Update nameservers in Namecheap to Cloudflare's
- [ ] Wait for nameserver propagation (check: whatsmydns.net)
- [ ] Authenticate domain in SendGrid (add CNAME records)
- [ ] Add SPF TXT record in Cloudflare DNS
- [ ] Add DMARC TXT record in Cloudflare DNS
- [ ] Enable Cloudflare Email Routing (forward to Gmail)
- [ ] Create verified sender in SendGrid with custom domain
- [ ] Verify sender email via forwarded message
- [ ] Update Firebase Functions with new sender email
- [ ] Deploy and test!

---

## Troubleshooting

### DNS Records Not Propagating
- Check status: [whatsmydns.net](https://whatsmydns.net)
- Wait up to 48 hours (usually 10-30 minutes)
- Clear DNS cache: `ipconfig /flushdns` (Windows)

### SendGrid Domain Verification Failed
- Double-check CNAME records in Cloudflare DNS
- Make sure Host/Value match exactly (no spaces)
- Wait 15-30 minutes and retry verification

### Emails Still Going to Spam
- Check SPF/DKIM/DMARC at [MXToolbox](https://mxtoolbox.com/SuperTool.aspx)
- Warm up sender: Start with low volume (5-10 emails/day)
- Avoid spam trigger words: "Free", "Click here", excessive caps
- Include unsubscribe link in emails

### Email Forwarding Not Working
- Verify destination email in Cloudflare Email Routing
- Check Gmail spam folder for verification email
- Ensure Cloudflare is the active DNS provider

---

## Alternative: Keep Gmail but Improve Deliverability

If you prefer not to use custom domain:

1. **SendGrid Domain Authentication**: Still do this for better reputation
2. **Warm Up Sending**: Send few emails initially, increase gradually
3. **Content Improvements**:
   - Add plain text version alongside HTML
   - Include unsubscribe link (even if it's just `mailto:support@gmail.com`)
   - Avoid spam trigger words
4. **Ask Users**: Have them mark emails as "Not Spam" and move to inbox

But custom domain is the BEST solution for long-term deliverability! 🚀
