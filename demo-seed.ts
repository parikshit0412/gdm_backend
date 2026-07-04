import bcrypt from 'bcryptjs';
import { db } from './src/db';
import { inArray } from 'drizzle-orm';
import {
  users,
  userRoles,
  jobSeekerProfiles,
  employerProfiles,
  businessPromoterProfiles,
  subscriptions,
  jobs,
  businessPromotions,
  workExperiences,
  educations,
  certifications,
} from './src/db/schema/index';

async function seedDemoData() {
  console.log('🌱 Starting full demo data seed...');
  const passwordHash = await bcrypt.hash('password123', 12);
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  console.log('Clearing old demo data...');
  const demoUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, ['seeker@demo.com', 'employer@demo.com', 'promoter@demo.com', 'admin@demo.com']));
  
  const demoUserIds = demoUsers.map(u => u.id);
  
  if (demoUserIds.length > 0) {
    await db.delete(jobs).where(inArray(jobs.employerId, demoUserIds));
    await db.delete(businessPromotions).where(inArray(businessPromotions.userId, demoUserIds));
    await db.delete(subscriptions).where(inArray(subscriptions.userId, demoUserIds));
    await db.delete(userRoles).where(inArray(userRoles.userId, demoUserIds));
    await db.delete(jobSeekerProfiles).where(inArray(jobSeekerProfiles.userId, demoUserIds));
    await db.delete(employerProfiles).where(inArray(employerProfiles.userId, demoUserIds));
    await db.delete(businessPromoterProfiles).where(inArray(businessPromoterProfiles.userId, demoUserIds));
    await db.delete(workExperiences).where(inArray(workExperiences.userId, demoUserIds));
    await db.delete(educations).where(inArray(educations.userId, demoUserIds));
    await db.delete(certifications).where(inArray(certifications.userId, demoUserIds));
    
    // Finally delete the users
    await db.delete(users).where(inArray(users.id, demoUserIds));
  }

  // 1. Create Users
  console.log('Creating users...');
  const [seeker, employer, promoter, admin] = await db
    .insert(users)
    .values([
      { email: 'seeker@demo.com', passwordHash, jobApplyCount: 0, jobPostCount: 0 },
      { email: 'employer@demo.com', passwordHash, jobApplyCount: 0, jobPostCount: 0 },
      { email: 'promoter@demo.com', passwordHash, jobApplyCount: 0, jobPostCount: 0 },
      { email: 'admin@demo.com', passwordHash, jobApplyCount: 0, jobPostCount: 0 },
    ])
    .returning();

  // 2. Assign Roles
  console.log('Assigning roles...');
  await db.insert(userRoles).values([
    { userId: seeker.id, roleId: 1 }, // job_seeker
    { userId: employer.id, roleId: 2 }, // job_poster
    { userId: promoter.id, roleId: 3 }, // business_promoter
    { userId: admin.id, roleId: 4 }, // super_user
  ]);

  // 3. Create Profiles
  console.log('Creating profiles...');
  await db.insert(jobSeekerProfiles).values({
    userId: seeker.id,
    title: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1 555-0100',
    location: 'San Francisco, CA',
    currentJobTitle: 'Full Stack Developer',
    totalExperienceYears: 4,
    expectedSalary: '120k USD',
    availability: '1_month',
    summary: 'Passionate developer with experience in React and Node.js.',
    highestDegree: 'B.S. Computer Science',
    fieldOfStudy: 'Software Engineering',
    institution: 'Tech University',
    graduationYear: 2020,
    skills: 'JavaScript, TypeScript, React, PostgreSQL',
    githubUrl: 'https://github.com/johndoe',
  });

  await db.insert(employerProfiles).values({
    userId: employer.id,
    companyName: 'TechNova Solutions',
    industry: 'Software',
    companySize: '51-200',
    foundedYear: 2018,
    about: 'We build scalable cloud infrastructure for modern enterprises.',
    headquarters: 'Austin, TX',
    websiteUrl: 'https://technovasolutions.demo',
    hrName: 'Alice Smith',
    hrEmail: 'hr@technovasolutions.demo',
  });

  await db.insert(businessPromoterProfiles).values({
    userId: promoter.id,
    businessName: 'Global Marketing Agency',
    businessCategory: 'digital_marketing',
    about: 'Helping brands grow their digital footprint.',
    contactEmail: 'contact@globalmarketing.demo',
    websiteUrl: 'https://globalmarketing.demo',
  });

  // 4. Create Subscriptions
  console.log('Creating subscriptions...');
  const [empSub, promSub] = await db
    .insert(subscriptions)
    .values([
      {
        userId: employer.id,
        subscriptionType: 'job_poster',
        tier: 'monthly',
        status: 'active',
        expiresAt: nextMonth,
      },
      {
        userId: promoter.id,
        subscriptionType: 'business_promoter',
        tier: 'monthly',
        status: 'active',
        expiresAt: nextMonth,
      },
    ])
    .returning();

  // 5. Create Jobs
  console.log('Creating jobs...');
  await db.insert(jobs).values([
    {
      employerId: employer.id,
      title: 'Senior Frontend Engineer',
      description: 'Looking for an expert in React and Next.js to lead our frontend team.',
    },
    {
      employerId: employer.id,
      title: 'Backend Node.js Developer',
      description: 'Build robust APIs using Express and PostgreSQL.',
    },
  ]);

  // 6. Create Business Promotions
  console.log('Creating promotions...');
  await db.insert(businessPromotions).values({
    userId: promoter.id,
    subscriptionId: promSub.id,
    businessName: 'Startup Launchpad Service',
    bannerUrl: 'https://via.placeholder.com/800x200?text=Startup+Launchpad',
    status: 'active',
  });

  // 7. Create Career History (for Job Seeker)
  console.log('Creating career history...');
  await db.insert(workExperiences).values([
    {
      userId: seeker.id,
      jobTitle: 'Frontend Developer',
      companyName: 'WebCorp',
      location: 'Remote',
      employmentType: 'full_time',
      startDate: '2020-06-01',
      endDate: '2022-12-31',
      isCurrentJob: false,
      description: 'Developed modern UIs using Vue.js.',
    },
    {
      userId: seeker.id,
      jobTitle: 'Full Stack Developer',
      companyName: 'NextGen Startup',
      location: 'San Francisco, CA',
      employmentType: 'full_time',
      startDate: '2023-01-15',
      isCurrentJob: true,
      description: 'Building the core product with React and Node.js.',
    },
  ]);

  await db.insert(educations).values({
    userId: seeker.id,
    degree: 'B.S.',
    fieldOfStudy: 'Computer Science',
    institution: 'Tech University',
    location: 'Boston, MA',
    startYear: 2016,
    endYear: 2020,
    isCurrentlyStudying: false,
    grade: '3.8 GPA',
  });

  await db.insert(certifications).values({
    userId: seeker.id,
    name: 'AWS Certified Developer',
    issuingOrganization: 'Amazon Web Services',
    issueDate: '2021-08-15',
    doesNotExpire: true,
    credentialId: 'AWS-DEV-12345',
  });

  console.log('✅ Demo data seeded successfully!');
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error('❌ Demo seed failed:', err);
  process.exit(1);
});
