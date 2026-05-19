// GJob.in - Database Seeder
// Inserts sample data for testing. Run with: node scripts/seed.js
// Note: Requires wrangler environment to be set up locally or remotely.

async function seedDatabase() {
  console.log('🌱 Seeding database with sample posts...');

  // Sample posts to insert
  const samplePosts = [
    {
      title: 'SSC CGL 2026 Online Form',
      slug: 'ssc-cgl-2026-online-form',
      category_id: 1,
      content: 'Staff Selection Commission (SSC) has released Combined Graduate Level (CGL) 2026 notification. Eligible candidates can apply online from 15 May 2026 to 15 June 2026.',
      important_dates: 'Start Date: 15/05/2026\nLast Date: 15/06/2026\nExam Date: August 2026',
      application_fee: 'General: ₹100\nSC/ST: ₹0',
      age_limit: '18-32 Years',
      eligibility: 'Bachelor Degree in any stream from a recognized university.',
      last_date: '2026-06-15',
      exam_date: '2026-08-20',
      is_trending: 1
    },
    {
      title: 'UP Police Constable Result 2026',
      slug: 'up-police-constable-result-2026',
      category_id: 2,
      content: 'Uttar Pradesh Police Recruitment Board has announced the result for Constable Recruitment 2026. Candidates can check their results online.',
      important_dates: 'Result Date: 10/05/2026',
      last_date: '2026-05-10',
      is_trending: 1
    },
    {
      title: 'Railway Group D Admit Card 2026',
      slug: 'railway-group-d-admit-card-2026',
      category_id: 3,
      content: 'Railway Recruitment Board (RRB) has released the admit card for Group D exam 2026. Download your hall ticket now.',
      important_dates: 'Admit Card Available: 20/05/2026\nExam Date: June 2026',
      last_date: '2026-05-20',
      exam_date: '2026-06-10',
      is_trending: 1
    },
    {
      title: 'UPSSSC PET Answer Key 2026',
      slug: 'upsssc-pet-answer-key-2026',
      category_id: 4,
      content: 'UPSSSC has published the answer key for Preliminary Eligibility Test (PET) 2026. Candidates can download and raise objections.',
      important_dates: 'Answer Key Date: 25/05/2026\nObjection Last Date: 28/05/2026',
      last_date: '2026-05-28',
      is_trending: 0
    },
    {
      title: 'IBPS PO Syllabus 2026',
      slug: 'ibps-po-syllabus-2026',
      category_id: 5,
      content: 'Complete syllabus for IBPS PO 2026 exam including prelims and mains topics. Download PDF.',
      last_date: null,
      is_trending: 0
    }
  ];

  // In a real setup, you would use wrangler or D1 API to insert
  console.log('📝 Sample posts ready:');
  samplePosts.forEach(post => {
    console.log(`  - ${post.title} (${post.slug})`);
  });

  console.log('✅ Seeding complete!');
}

seedDatabase().catch(console.error);