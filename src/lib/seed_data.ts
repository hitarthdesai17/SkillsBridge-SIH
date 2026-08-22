import { Opportunity } from '../types';

export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_data_analyst_intern_01',
    title: 'Data Analyst Intern',
    organization: 'Apex Analytics Corp',
    opportunity_type: 'internship',
    description: 'Seeking a Data Analyst Intern to assist with SQL data extraction, Python data cleaning, and dataset transformation.',
    source: 'Company Careers Portal',
    source_url: 'https://demo.apexanalytics.com/careers/data-analyst-intern',
    deadline: '2026-11-30T23:59:59Z',
    location: 'Bangalore, India (Hybrid)',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹25,000 - ₹35,000 / month',
    verification_status: 'VERIFIED',
    explicit_eligibility: { required_degree: "Bachelor's Degree" },
    requirements: [
      { id: 'req_01_1', opportunity_id: 'opp_data_analyst_intern_01', requirement_type: 'hard_eligibility', name: "Bachelor's Degree in CS/IT/Math/Stats", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_01_2', opportunity_id: 'opp_data_analyst_intern_01', requirement_type: 'required_skill', name: 'Python Data Analysis (Pandas, NumPy)', normalized_name: 'python', is_mandatory: true },
      { id: 'req_01_3', opportunity_id: 'opp_data_analyst_intern_01', requirement_type: 'required_skill', name: 'SQL Querying & Data Extraction', normalized_name: 'sql', is_mandatory: true },
      { id: 'req_01_4', opportunity_id: 'opp_data_analyst_intern_01', requirement_type: 'preferred_skill', name: 'Data Visualization Fundamentals', normalized_name: 'data_visualization', is_mandatory: false }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_upsc_cse_04',
    title: 'UPSC Civil Services Examination (IAS / IPS / IFS)',
    organization: 'Union Public Service Commission (UPSC)',
    opportunity_type: 'competitive_exam',
    pathway_category: 'COMPETITIVE_EXAM',
    career_domain: 'CIVIL_GOVERNMENT',
    description: 'Premier national competitive examination for Indian Administrative Service (IAS), Police Service (IPS), and Foreign Service (IFS).',
    source: 'UPSC Official Portal',
    source_url: 'https://upsc.gov.in',
    deadline: '2026-03-05T23:59:59Z',
    location: 'All India (Central Government)',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: 'Pay Level 10 (₹56,100 - ₹1,77,500)',
    verification_status: 'OFFICIAL',
    explicit_eligibility: {
      min_age: 21,
      max_age: 32,
      required_degree: "Bachelor's Degree",
      nationality: 'Indian Citizen',
      attempts_allowed: 6
    },
    official_source_metadata: {
      official_source_url: 'https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination',
      source_name: 'UPSC Official Notification',
      last_verified_at: '2026-02-14T00:00:00Z',
      requires_notification_verification: true
    },
    requirements: [
      { id: 'req_upsc_1', opportunity_id: 'opp_upsc_cse_04', requirement_type: 'hard_eligibility', name: "Graduation Degree in Any Stream", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_upsc_2', opportunity_id: 'opp_upsc_cse_04', requirement_type: 'exam_stage', name: 'General Studies & CSAT Prelims Coverage', normalized_name: 'general_studies', is_mandatory: true },
      { id: 'req_upsc_3', opportunity_id: 'opp_upsc_cse_04', requirement_type: 'exam_stage', name: 'Current Affairs & National Governance Knowledge', normalized_name: 'current_affairs', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_fitness_coach_05',
    title: 'Personal Fitness Trainer & Coach',
    organization: 'FitLife Health Clubs',
    opportunity_type: 'private_job',
    pathway_category: 'JOB',
    career_domain: 'FITNESS_WELLNESS',
    description: 'Seeking a certified Personal Trainer to design custom fitness programs, conduct group fitness classes, and manage client progress.',
    source: 'Health Jobs Portal',
    source_url: 'https://demo.fitlife.com/careers/trainer',
    deadline: '2026-11-15T23:59:59Z',
    location: 'Mumbai, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 1.0,
    stipend_salary_range: '₹35,000 - ₹50,000 / month',
    verification_status: 'VERIFIED',
    explicit_eligibility: { required_degree: "Bachelor's Degree" },
    requirements: [
      { id: 'req_fit_1', opportunity_id: 'opp_fitness_coach_05', requirement_type: 'hard_eligibility', name: "Degree in Kinesiology / Physical Education", normalized_name: 'kinesiology', is_mandatory: false },
      { id: 'req_fit_2', opportunity_id: 'opp_fitness_coach_05', requirement_type: 'required_skill', name: 'Personal Training & Fitness Instruction', normalized_name: 'personal_training', is_mandatory: true },
      { id: 'req_fit_3', opportunity_id: 'opp_fitness_coach_05', requirement_type: 'required_skill', name: 'Nutrition & Diet Planning', normalized_name: 'nutrition', is_mandatory: true },
      { id: 'req_fit_4', opportunity_id: 'opp_fitness_coach_05', requirement_type: 'required_skill', name: 'Client Sales & Communication', normalized_name: 'sales', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_bi_intern_02',
    title: 'Business Intelligence Intern',
    organization: 'Global Retail Insights',
    opportunity_type: 'internship',
    description: 'Looking for a BI intern to build interactive Power BI sales dashboards and analyze retail performance metrics.',
    source: 'Tech Jobs Board',
    source_url: 'https://demo.retailinsights.com/bi-intern',
    deadline: '2026-12-15T23:59:59Z',
    location: 'Remote',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹20,000 - ₹30,000 / month',
    verification_status: 'VERIFIED',
    explicit_eligibility: { required_degree: "Bachelor's Degree" },
    requirements: [
      { id: 'req_02_1', opportunity_id: 'opp_bi_intern_02', requirement_type: 'hard_eligibility', name: "Bachelor's Degree", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_02_2', opportunity_id: 'opp_bi_intern_02', requirement_type: 'required_skill', name: 'SQL Data Extraction', normalized_name: 'sql', is_mandatory: true },
      { id: 'req_02_3', opportunity_id: 'opp_bi_intern_02', requirement_type: 'required_skill', name: 'Power BI Dashboarding & DAX', normalized_name: 'power_bi', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_ml_engineer_03',
    title: 'Machine Learning Engineer Intern',
    organization: 'NeuroAI Systems',
    opportunity_type: 'private_job',
    description: 'Advanced machine learning role focused on model deployment, Docker containerization, and production ML pipelines.',
    source: 'NeuroAI Portal',
    deadline: '2026-10-30T23:59:59Z',
    location: 'Hyderabad, India',
    education_level_required: "Master's Degree",
    min_experience_years: 1.0,
    stipend_salary_range: '₹50,000 - ₹70,000 / month',
    verification_status: 'VERIFIED',
    explicit_eligibility: { required_degree: "Master's Degree" },
    requirements: [
      { id: 'req_03_1', opportunity_id: 'opp_ml_engineer_03', requirement_type: 'hard_eligibility', name: "Master's Degree in CS/AI", normalized_name: 'masters', is_mandatory: true },
      { id: 'req_03_2', opportunity_id: 'opp_ml_engineer_03', requirement_type: 'required_skill', name: 'Machine Learning & Deep Learning', normalized_name: 'machine_learning', is_mandatory: true },
      { id: 'req_03_3', opportunity_id: 'opp_ml_engineer_03', requirement_type: 'required_skill', name: 'ML Model Deployment & Docker', normalized_name: 'docker', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_govt_apprentice_04',
    title: 'Junior Data Analyst Apprentice',
    organization: 'National Informatics Centre (NIC)',
    opportunity_type: 'government',
    description: 'Government apprenticeship for fresh graduates to process public dataset archives.',
    source: 'NIC Official Portal',
    deadline: '2026-11-15T23:59:59Z',
    location: 'New Delhi, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹28,000 / month (Stipend)',
    verification_status: 'OFFICIAL',
    explicit_eligibility: { required_degree: "Bachelor's Degree", nationality: 'Indian' },
    requirements: [
      { id: 'req_04_1', opportunity_id: 'opp_govt_apprentice_04', requirement_type: 'hard_eligibility', name: "Bachelor's Degree in Science/Engineering", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_04_2', opportunity_id: 'opp_govt_apprentice_04', requirement_type: 'required_skill', name: 'Python Data Cleaning', normalized_name: 'python', is_mandatory: true },
      { id: 'req_04_3', opportunity_id: 'opp_govt_apprentice_04', requirement_type: 'required_skill', name: 'SQL Database Management', normalized_name: 'sql', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_expired_role_05',
    title: 'Frontend Developer Intern (Closed)',
    organization: 'WebCraft Studio',
    opportunity_type: 'internship',
    description: 'Expired internship posting for testing hard eligibility deadline failures.',
    source: 'Demo Portal',
    deadline: '2025-01-01T00:00:00Z',
    location: 'Remote',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    verification_status: 'DEMO',
    requirements: [
      { id: 'req_05_1', opportunity_id: 'opp_expired_role_05', requirement_type: 'required_skill', name: 'React.js', normalized_name: 'react', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_software_dev_06',
    title: 'Junior Software Engineer',
    organization: 'CloudScale Technologies',
    opportunity_type: 'private_job',
    description: 'Entry-level software engineering role working on Node.js backend microservices and TypeScript APIs.',
    source: 'Company Portal',
    deadline: '2026-12-01T23:59:59Z',
    location: 'Pune, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹6.5 - ₹8.5 LPA',
    verification_status: 'VERIFIED',
    explicit_eligibility: { required_degree: "Bachelor's Degree" },
    requirements: [
      { id: 'req_06_1', opportunity_id: 'opp_software_dev_06', requirement_type: 'hard_eligibility', name: "Bachelor's Degree in CS/IT", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_06_2', opportunity_id: 'opp_software_dev_06', requirement_type: 'required_skill', name: 'JavaScript / TypeScript', normalized_name: 'typescript', is_mandatory: true },
      { id: 'req_06_3', opportunity_id: 'opp_software_dev_06', requirement_type: 'required_skill', name: 'Node.js Express REST APIs', normalized_name: 'node_js', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_web_dev_intern_07',
    title: 'Full-Stack Web Development Intern',
    organization: 'PixelCraft Innovations',
    opportunity_type: 'internship',
    description: 'Build modern React components, CSS layouts, and connect to PostgreSQL backend databases.',
    source: 'Internship Portal',
    deadline: '2026-11-20T23:59:59Z',
    location: 'Remote',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹18,000 - ₹25,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_07_1', opportunity_id: 'opp_web_dev_intern_07', requirement_type: 'required_skill', name: 'React.js Front-end', normalized_name: 'react', is_mandatory: true },
      { id: 'req_07_2', opportunity_id: 'opp_web_dev_intern_07', requirement_type: 'required_skill', name: 'CSS & HTML Fundamentals', normalized_name: 'css', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_cloud_devops_08',
    title: 'DevOps & Cloud Engineering Apprentice',
    organization: 'InfraScale Systems',
    opportunity_type: 'apprenticeship',
    description: 'Learn and assist with AWS cloud infrastructure, Linux server administration, and CI/CD pipelines.',
    source: 'Apprenticeship Board',
    deadline: '2026-12-10T23:59:59Z',
    location: 'Bangalore, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0.5,
    stipend_salary_range: '₹30,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_08_1', opportunity_id: 'opp_cloud_devops_08', requirement_type: 'required_skill', name: 'Linux Server Administration', normalized_name: 'linux', is_mandatory: true },
      { id: 'req_08_2', opportunity_id: 'opp_cloud_devops_08', requirement_type: 'required_skill', name: 'AWS Cloud Fundamentals', normalized_name: 'aws', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_python_backend_09',
    title: 'Python Backend Engineer Intern',
    organization: 'DataFlow Systems',
    opportunity_type: 'internship',
    description: 'Design FastAPI Python web microservices, SQL query models, and Redis caching infrastructure.',
    source: 'Company Careers',
    deadline: '2026-11-25T23:59:59Z',
    location: 'Mumbai, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹25,000 - ₹35,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_09_1', opportunity_id: 'opp_python_backend_09', requirement_type: 'required_skill', name: 'Python Backend Development', normalized_name: 'python', is_mandatory: true },
      { id: 'req_09_2', opportunity_id: 'opp_python_backend_09', requirement_type: 'required_skill', name: 'Relational SQL Databases', normalized_name: 'sql', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_data_engineer_10',
    title: 'Data Engineering Intern',
    organization: 'StreamData Tech',
    opportunity_type: 'internship',
    description: 'Build Apache Spark data processing pipelines, SQL data warehouses, and automated ETL jobs.',
    source: 'Tech Careers',
    deadline: '2026-12-05T23:59:59Z',
    location: 'Chennai, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹30,000 - ₹40,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_10_1', opportunity_id: 'opp_data_engineer_10', requirement_type: 'required_skill', name: 'SQL Querying', normalized_name: 'sql', is_mandatory: true },
      { id: 'req_10_2', opportunity_id: 'opp_data_engineer_10', requirement_type: 'required_skill', name: 'PySpark / Data Pipelines', normalized_name: 'spark', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_cybersecurity_11',
    title: 'Junior Cybersecurity Analyst',
    organization: 'SecureNet Defence',
    opportunity_type: 'private_job',
    description: 'Monitor security event logs, perform network vulnerability assessments, and report threats.',
    source: 'CyberJobs',
    deadline: '2026-12-20T23:59:59Z',
    location: 'Delhi NCR, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹5.5 - ₹7.0 LPA',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_11_1', opportunity_id: 'opp_cybersecurity_11', requirement_type: 'required_skill', name: 'Network Security Fundamentals', normalized_name: 'networking', is_mandatory: true },
      { id: 'req_11_2', opportunity_id: 'opp_cybersecurity_11', requirement_type: 'required_skill', name: 'Linux Security Auditing', normalized_name: 'linux', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_ai_research_12',
    title: 'AI Research Intern (NLP & LLMs)',
    organization: 'Cognitive Research Lab',
    opportunity_type: 'internship',
    description: 'Assist AI researchers with Transformer model fine-tuning, PyTorch experiments, and dataset evaluation.',
    source: 'Research Gate Portal',
    deadline: '2026-11-28T23:59:59Z',
    location: 'Bangalore, India',
    education_level_required: "Master's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹40,000 - ₹50,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_12_1', opportunity_id: 'opp_ai_research_12', requirement_type: 'hard_eligibility', name: "Master's Degree in CS/AI", normalized_name: 'masters', is_mandatory: true },
      { id: 'req_12_2', opportunity_id: 'opp_ai_research_12', requirement_type: 'required_skill', name: 'PyTorch Deep Learning', normalized_name: 'pytorch', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_mobile_app_13',
    title: 'Mobile Application Intern (React Native)',
    organization: 'AppVentures Studio',
    opportunity_type: 'internship',
    description: 'Develop cross-platform mobile apps for iOS and Android using React Native and TypeScript.',
    source: 'App Portal',
    deadline: '2026-12-08T23:59:59Z',
    location: 'Remote',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹20,000 - ₹30,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_13_1', opportunity_id: 'opp_mobile_app_13', requirement_type: 'required_skill', name: 'React Native Development', normalized_name: 'react_native', is_mandatory: true },
      { id: 'req_13_2', opportunity_id: 'opp_mobile_app_13', requirement_type: 'required_skill', name: 'JavaScript / TypeScript', normalized_name: 'typescript', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_qa_automation_14',
    title: 'QA Automation Engineer Intern',
    organization: 'QualityFirst Labs',
    opportunity_type: 'internship',
    description: 'Write automated end-to-end web test suites using Python Selenium and Jest API tests.',
    source: 'QA Careers',
    deadline: '2026-12-18T23:59:59Z',
    location: 'Pune, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹20,000 - ₹28,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_14_1', opportunity_id: 'opp_qa_automation_14', requirement_type: 'required_skill', name: 'Python Automation Scripting', normalized_name: 'python', is_mandatory: true },
      { id: 'req_14_2', opportunity_id: 'opp_qa_automation_14', requirement_type: 'required_skill', name: 'Software Testing Fundamentals', normalized_name: 'qa_testing', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_ui_ux_analytics_15',
    title: 'Product Analytics & UI/UX Intern',
    organization: 'DesignMetrics Tech',
    opportunity_type: 'internship',
    description: 'Analyze user funnel conversion events using SQL queries and build UI dashboard prototypes.',
    source: 'Design Careers',
    deadline: '2026-11-22T23:59:59Z',
    location: 'Remote',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹22,000 - ₹30,000 / month',
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'req_15_1', opportunity_id: 'opp_ui_ux_analytics_15', requirement_type: 'required_skill', name: 'SQL Event Analytics', normalized_name: 'sql', is_mandatory: true },
      { id: 'req_15_2', opportunity_id: 'opp_ui_ux_analytics_15', requirement_type: 'required_skill', name: 'Figma UI Wireframing', normalized_name: 'figma', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'opp_public_sector_16',
    title: 'Digital India e-Governance Apprentice',
    organization: 'Ministry of Electronics & IT (MeitY)',
    opportunity_type: 'government',
    description: 'Government e-governance apprenticeship supporting public database processing and API verification.',
    source: 'MeitY Portal',
    deadline: '2026-12-31T23:59:59Z',
    location: 'New Delhi, India',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    stipend_salary_range: '₹30,000 / month',
    verification_status: 'OFFICIAL',
    explicit_eligibility: { required_degree: "Bachelor's Degree", nationality: 'Indian' },
    requirements: [
      { id: 'req_16_1', opportunity_id: 'opp_public_sector_16', requirement_type: 'hard_eligibility', name: "Bachelor's Degree", normalized_name: 'bachelors', is_mandatory: true },
      { id: 'req_16_2', opportunity_id: 'opp_public_sector_16', requirement_type: 'required_skill', name: 'Python Programming', normalized_name: 'python', is_mandatory: true },
      { id: 'req_16_3', opportunity_id: 'opp_public_sector_16', requirement_type: 'required_skill', name: 'SQL Querying', normalized_name: 'sql', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  }
];
