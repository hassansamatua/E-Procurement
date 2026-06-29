"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  registration_number: z.string().optional(),
  tin_number: z.string().optional(),
  vat_number: z.string().optional(),
  business_license_number: z.string().optional(),
  contact_person: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  physical_address: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerSupplier, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { categories: [] },
  });

  const selectedCategories = watch('categories');

  const toggleCategory = (cat: string) => {
    const current = selectedCategories || [];
    if (current.includes(cat)) {
      setValue('categories', current.filter((c) => c !== cat));
    } else {
      setValue('categories', [...current, cat]);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const { confirm_password, ...submitData } = data;
      await registerSupplier(submitData);
      setSuccess('Registration successful! Your account is pending admin approval.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8" style={{background:'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'}}>
      <Card className="w-full max-w-2xl rounded-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.jpeg" alt="E-Procurement Logo" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{color:'#1B5E20'}}>Supplier Registration</CardTitle>
          <CardDescription>Register your company to access procurement opportunities</CardDescription>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? 'text-white' : 'bg-gray-200 text-gray-600'}`} style={step >= s ? {backgroundColor:'#1B5E20'} : {}}>
                {s}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-center">
              {success}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Company Name *</label>
                      <Input {...register('company_name')} placeholder="Company name" />
                      {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Registration Number</label>
                      <Input {...register('registration_number')} placeholder="Registration number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">TIN Number</label>
                      <Input {...register('tin_number')} placeholder="TIN number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">VAT Number</label>
                      <Input {...register('vat_number')} placeholder="VAT number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Person *</label>
                      <Input {...register('contact_person')} placeholder="Full name" />
                      {errors.contact_person && <p className="text-xs text-red-500">{errors.contact_person.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone *</label>
                      <Input {...register('phone')} placeholder="+255..." />
                      {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input type="email" {...register('email')} placeholder="company@email.com" />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Country</label>
                      <Input {...register('country')} placeholder="Country" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Region</label>
                      <Input {...register('region')} placeholder="Region" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Physical Address</label>
                      <Input {...register('physical_address')} placeholder="Physical address" />
                    </div>
                  </div>
                  <Button type="button" onClick={() => setStep(2)} className="w-full">Next</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Banking & Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Bank Name</label>
                      <Input {...register('bank_name')} placeholder="Bank name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Number</label>
                      <Input {...register('account_number')} placeholder="Account number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Name</label>
                      <Input {...register('account_name')} placeholder="Account name" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categories *</label>
                    <div className="flex gap-3 mt-2">
                      {['Goods', 'Works', 'Services'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedCategories?.includes(cat)
                              ? 'text-white border-transparent'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                          style={selectedCategories?.includes(cat) ? {backgroundColor:'#1B5E20'} : {}}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {errors.categories && <p className="text-xs text-red-500 mt-1">{errors.categories.message}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button type="button" onClick={() => setStep(3)} className="flex-1">Next</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Account Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <Input type="password" {...register('password')} placeholder="Min 8 characters" />
                      {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Confirm Password *</label>
                      <Input type="password" {...register('confirm_password')} placeholder="Confirm password" />
                      {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}

          <div className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="hover:underline font-medium" style={{color:'#1B5E20'}}>Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
