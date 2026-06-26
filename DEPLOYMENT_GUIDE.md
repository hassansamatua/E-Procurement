# E-Procurement System - Free Deployment Guide

This guide will help you deploy your E-Procurement System online for free using:
- **Vercel** (free) - Next.js hosting with free subdomain
- **Supabase** (free tier) - PostgreSQL database
- **Cloudinary** (free tier) - File uploads
- **Resend** (free tier) - Email notifications

## Step 1: Set Up Supabase (Free PostgreSQL Database)

Supabase offers a generous free tier with PostgreSQL.

1. Go to [https://supabase.com](https://supabase.com) and sign up for free
2. Create a new project:
   - Click "New Project"
   - Name it `e-procurement`
   - Set a strong database password
   - Select region closest to your users
   - Click "Create new project"
3. Get your connection credentials:
   - Go to Settings → Database
   - Copy these values:
     - `DATABASE_HOST` = from "Host" (e.g., `db.xxx.supabase.co`)
     - `DATABASE_PORT` = 5432
     - `DATABASE_USER` = from "Database name" (usually `postgres`)
     - `DATABASE_PASSWORD` = the password you set during project creation
     - `DATABASE_NAME` = from "Database name" (usually `postgres`)
     - `DATABASE_SSL` = `true`

4. Import your database schema:
   - Go to SQL Editor in Supabase dashboard
   - Click "New Query"
   - Copy and paste the contents of `schema-postgres.sql`
   - Click "Run" to execute the schema

## Step 2: Set Up Cloudinary (Free File Storage)

1. Go to [https://cloudinary.com](https://cloudinary.com) and sign up for free
2. Go to your Dashboard → Settings → Security
3. Copy these values:
   - `CLOUDINARY_CLOUD_NAME` = djxlnmpmp
   - `CLOUDINARY_API_KEY` = 651745917385889
   - `CLOUDINARY_API_SECRET` = Hd0ztrZCisTxAOHFOWPakciFfOQ
4. Create an upload preset (optional but recommended):
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Name it `unsigned-upload`
   - Set "Signing mode" to "Unsigned"
   - Save and copy the preset name as `CLOUDINARY_UPLOAD_PRESET`

## Step 3: Set Up Resend (Free Email Service)

1. Go to [https://resend.com](https://resend.com) and sign up for free
2. Verify your email address
3. Get your API key:
   - Go to API Keys → Create API Key
   - Name it "E-Procurement"
   - Copy the key as `RESEND_API_KEY`
4. Set up sender domain (use Resend's free domain):
   - Go to Domains → Add domain
   - Use Resend's free domain: `onresend.com`
   - Enter your desired subdomain (e.g., `your-app.onresend.com`)
   - Click "Add Domain" - no DNS verification needed for onresend.com
5. Set `RESEND_FROM_EMAIL` to your onresend.com email (e.g., `noreply@your-app.onresend.com`)

## Step 4: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   cd "c:\xampp\htdocs\E-Procurment System\E-Procurement"
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? → **Yes**
   - Link to existing project? → **No** (first time)
   - Project name → `e-procurement` (or your choice)
   - Directory → `./`
   - Override settings? → **No**

5. Add environment variables in Vercel dashboard:
   - Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project → Settings → Environment Variables
   - Add all variables from `.env.example` with your actual values:
     ```
     DATABASE_HOST=aws.connect.psdb.cloud
     DATABASE_PORT=3306
     DATABASE_USER=your_planetscale_username
     DATABASE_PASSWORD=your_planetscale_password
     DATABASE_NAME=e_procurement
     JWT_SECRET=generate_a_random_long_string_here
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     CLOUDINARY_UPLOAD_PRESET=your_preset_name
     RESEND_API_KEY=re_your_resend_key
     RESEND_FROM_EMAIL=noreply@your-app.vercel.app
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     NODE_ENV=production
     ```

6. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your Git repository (if on GitHub/GitLab/Bitbucket)
3. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables in the deployment settings
5. Click "Deploy"

## Step 5: Import Database Schema to Supabase

After deployment, you need to create the database tables:

### Using Supabase SQL Editor:
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `schema-postgres.sql`
5. Click "Run" to execute the schema

### Using the migration script:
```bash
npm run db:migrate
```

## Step 6: Seed Initial Data (Optional)

To create initial users and roles:
```bash
npm run db:seed
```

This will create:
- Default roles (Staff, HOD, Procurement Officer, etc.)
- A super admin user (email: `admin@eprocurement.com`, password: `admin123`)

## Step 7: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://e-procurement.vercel.app`)
2. Test login with the seeded admin credentials
3. Test file uploads (should upload to Cloudinary)
4. Test email notifications (check Resend dashboard)
5. Test all user roles and workflows

## Step 8: Set Up Custom Domain (Optional)

If you want a custom domain instead of `.vercel.app`:

1. Buy a domain from any registrar (Namecheap, GoDaddy, etc.)
2. In Vercel dashboard → Settings → Domains
3. Add your domain
4. Update DNS records as instructed by Vercel
5. Update `NEXT_PUBLIC_APP_URL` and `RESEND_FROM_EMAIL` environment variables
6. Redeploy

## Free Tier Limits

### Vercel (Hobby Plan - Free)
- Unlimited projects
- 100GB bandwidth per month
- 6,000 minutes of build time per month
- Serverless Functions: 100GB-hours per month
- Automatic HTTPS

### Supabase (Free Tier)
- 500MB database storage
- 1GB file storage
- 2GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests
- Real-time subscriptions
- Auto-suspend after 1 week of inactivity

### Cloudinary (Free)
- 25GB storage
- 25GB bandwidth per month
- 25 transformations per month
- Unlimited requests

### Resend (Free)
- 3,000 emails per month
- 1 domain
- Webhooks

## Troubleshooting

### Database Connection Issues
- Ensure Supabase project is active
- Check SSL is enabled (Supabase requires SSL)
- Verify environment variables are set correctly in Vercel
- Ensure `DATABASE_SSL=true` is set

### File Upload Failures
- Check Cloudinary API credentials
- Ensure upload preset is set to "Unsigned" if not using signed uploads
- Verify file size is under 10MB

### Email Not Sending
- Verify Resend API key is correct
- Check sender domain is verified in Resend
- Ensure `RESEND_FROM_EMAIL` matches verified domain
- Check Resend dashboard for email logs

### Build Errors
- Run `npm run build` locally first to catch errors
- Check Node.js version (should be 18+)
- Ensure all dependencies are installed

## Environment Variables Reference

Copy this to your Vercel project settings:

```
DATABASE_HOST=db.xxx.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_supabase_password
DATABASE_NAME=postgres
DATABASE_SSL=true
JWT_SECRET=your_random_secret_key_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Security Notes

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Rotate API keys** periodically
4. **Enable 2FA** on all service accounts
5. **Monitor usage** to stay within free tier limits
6. **Set up alerts** for quota limits

## Support

If you encounter issues:
- Vercel: [https://vercel.com/docs](https://vercel.com/docs)
- PlanetScale: [https://docs.planetscale.com](https://docs.planetscale.com)
- Cloudinary: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Resend: [https://resend.com/docs](https://resend.com/docs)
