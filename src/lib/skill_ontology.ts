import { CareerDomainType, MatchType, SkillKind } from '../types';

export interface OntologyNode {
  id: string;
  canonicalName: string;
  category: 'database' | 'programming_language' | 'frontend' | 'backend' | 'devops_cloud' | 'data_ai' | 'tools' | 'domain_skill' | 'soft_skill' | 'general';
  domain: CareerDomainType;
  aliases: string[];
  parents: string[]; // Parent category IDs
  children: string[]; // Child technology IDs
  specializations?: Record<string, { requiredEvidenceKeywords: string[] }>;
  /** SKILL vs TOOL vs PLATFORM vs METHODOLOGY vs DOMAIN_KNOWLEDGE vs SOFT_SKILL. */
  kind?: SkillKind;
  /** Free-text grouping label surfaced in the profile UI. */
  subcategory?: string;
}

export const SKILL_ONTOLOGY: Record<string, OntologyNode> = {
  // ==========================================
  // DATABASES & STORAGE HIERARCHY
  // ==========================================
  'database_systems': {
    id: 'database_systems',
    canonicalName: 'Database Management Systems',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: [
      'databases',
      'database management',
      'database',
      'dbms',
      'database management systems',
      'database systems',
      'dbms concepts'
    ],
    parents: [],
    children: ['relational_database', 'nosql_database', 'sql', 'mysql', 'postgresql', 'sqlite', 'oracle_database', 'sql_server', 'mongodb']
  },
  'relational_database': {
    id: 'relational_database',
    canonicalName: 'Relational Database',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: [
      'rdbms',
      'relational databases',
      'relational db',
      'relational database management system',
      'sql database',
      'relational sql databases',
      'relational database schemas',
      'relational database systems'
    ],
    parents: ['database_systems'],
    children: ['mysql', 'postgresql', 'sqlite', 'oracle_database', 'sql_server', 'sql']
  },
  'nosql_database': {
    id: 'nosql_database',
    canonicalName: 'NoSQL Database',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['nosql', 'non-relational database', 'document database', 'nosql databases'],
    parents: ['database_systems'],
    children: ['mongodb', 'redis', 'cassandra', 'dynamodb']
  },
  'mysql': {
    id: 'mysql',
    canonicalName: 'MySQL',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['mysql', 'my sql', 'mysql database', 'mysql rdbms'],
    parents: ['relational_database', 'sql', 'database_systems'],
    children: []
  },
  'postgresql': {
    id: 'postgresql',
    canonicalName: 'PostgreSQL',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['postgresql', 'postgres', 'psql', 'postgresql database'],
    parents: ['relational_database', 'sql', 'database_systems'],
    children: [],
    specializations: {
      'postgresql_administration': {
        requiredEvidenceKeywords: ['dba', 'admin', 'replication', 'backup', 'tuning', 'wal', 'vacuum', 'pg_dump', 'cluster', 'failover']
      }
    }
  },
  'sqlite': {
    id: 'sqlite',
    canonicalName: 'SQLite',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['sqlite', 'sqlite3', 'sqlite database'],
    parents: ['relational_database', 'sql', 'database_systems'],
    children: []
  },
  'oracle_database': {
    id: 'oracle_database',
    canonicalName: 'Oracle Database',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['oracle db', 'oracle database', 'pl/sql', 'oracle rdbms'],
    parents: ['relational_database', 'sql', 'database_systems'],
    children: []
  },
  'sql_server': {
    id: 'sql_server',
    canonicalName: 'Microsoft SQL Server',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['sql server', 'mssql', 't-sql', 'microsoft sql server'],
    parents: ['relational_database', 'sql', 'database_systems'],
    children: []
  },
  'mongodb': {
    id: 'mongodb',
    canonicalName: 'MongoDB',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['mongodb', 'mongo', 'mongoose', 'mongodb database'],
    parents: ['nosql_database', 'database_systems'],
    children: []
  },
  'redis': {
    id: 'redis',
    canonicalName: 'Redis',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: ['redis', 'redis cache', 'redis in-memory database'],
    parents: ['nosql_database', 'database_systems'],
    children: []
  },
  'sql': {
    id: 'sql',
    canonicalName: 'SQL',
    category: 'database',
    domain: 'DATA_ANALYTICS',
    aliases: [
      'sql',
      'structured query language',
      'sql queries',
      'sql querying',
      'sql data extraction',
      'sql querying & data extraction',
      'sql querying and data extraction',
      'sql database management',
      'sql data cleaning',
      'sql query models',
      'sql data warehouses'
    ],
    parents: ['database_systems', 'relational_database'],
    children: ['mysql', 'postgresql', 'sqlite', 'oracle_database', 'sql_server']
  },
  'jdbc': {
    id: 'jdbc',
    canonicalName: 'JDBC',
    category: 'database',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['jdbc', 'java database connectivity', 'jdbc api'],
    parents: ['database_systems'],
    children: []
  },

  // ==========================================
  // PROGRAMMING LANGUAGES HIERARCHY
  // ==========================================
  'programming_languages': {
    id: 'programming_languages',
    canonicalName: 'Programming Languages',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['coding', 'programming', 'software development', 'programming languages'],
    parents: [],
    children: ['python', 'java', 'javascript', 'typescript', 'c', 'c_plus_plus', 'c_sharp', 'go', 'rust']
  },
  'python': {
    id: 'python',
    canonicalName: 'Python',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['python', 'python3', 'py', 'python programming', 'python backend development', 'python data analysis (pandas, numpy)', 'python data cleaning'],
    parents: ['programming_languages'],
    children: ['pandas', 'numpy']
  },
  'java': {
    id: 'java',
    canonicalName: 'Java',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['java', 'core java', 'java se', 'java ee', 'java programming'],
    parents: ['programming_languages'],
    children: []
  },
  'javascript': {
    id: 'javascript',
    canonicalName: 'JavaScript',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['javascript', 'js', 'es6', 'ecmascript', 'javascript / typescript', 'modern javascript'],
    parents: ['programming_languages'],
    children: ['typescript', 'react', 'node_js']
  },
  'typescript': {
    id: 'typescript',
    canonicalName: 'TypeScript',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['typescript', 'ts', 'typescript development'],
    parents: ['programming_languages', 'javascript'],
    children: []
  },
  'c': {
    id: 'c',
    canonicalName: 'C Programming',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['c language', 'c programming', 'ansi c'],
    parents: ['programming_languages'],
    children: []
  },
  'c_plus_plus': {
    id: 'c_plus_plus',
    canonicalName: 'C++',
    category: 'programming_language',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['c++', 'cpp', 'c/c++'],
    parents: ['programming_languages'],
    children: []
  },

  // ==========================================
  // WEB & BACKEND FRAMEWORKS
  // ==========================================
  'backend_frameworks': {
    id: 'backend_frameworks',
    canonicalName: 'Backend Frameworks',
    category: 'backend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['backend development', 'web services', 'rest apis', 'backend engineering'],
    parents: [],
    children: ['node_js', 'express_js', 'django', 'django_rest_framework', 'fastapi', 'flask', 'spring_boot']
  },
  'node_js': {
    id: 'node_js',
    canonicalName: 'Node.js',
    category: 'backend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['node.js', 'nodejs', 'node', 'node.js express rest apis'],
    parents: ['backend_frameworks', 'javascript'],
    children: ['express_js']
  },
  'express_js': {
    id: 'express_js',
    canonicalName: 'Express.js',
    category: 'backend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['express.js', 'expressjs', 'express', 'node express'],
    parents: ['backend_frameworks', 'node_js'],
    children: []
  },
  'django': {
    id: 'django',
    canonicalName: 'Django',
    category: 'backend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['django', 'django framework', 'python django'],
    parents: ['backend_frameworks', 'python'],
    children: ['django_rest_framework']
  },
  'django_rest_framework': {
    id: 'django_rest_framework',
    canonicalName: 'Django REST Framework',
    category: 'backend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['django rest framework', 'drf', 'django rest', 'django-rest-framework'],
    parents: ['django', 'backend_frameworks'],
    children: []
  },

  // ==========================================
  // FRONTEND FRAMEWORKS
  // ==========================================
  'frontend_frameworks': {
    id: 'frontend_frameworks',
    canonicalName: 'Frontend Frameworks',
    category: 'frontend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['frontend development', 'client-side development', 'ui development'],
    parents: [],
    children: ['react', 'next_js', 'angular', 'vue_js', 'html', 'css']
  },
  'react': {
    id: 'react',
    canonicalName: 'React.js',
    category: 'frontend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['react', 'react.js', 'reactjs', 'react front-end', 'react.js front-end'],
    parents: ['frontend_frameworks', 'javascript'],
    children: ['next_js']
  },
  'next_js': {
    id: 'next_js',
    canonicalName: 'Next.js',
    category: 'frontend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['next.js', 'nextjs', 'next'],
    parents: ['react', 'frontend_frameworks'],
    children: []
  },
  'html': {
    id: 'html',
    canonicalName: 'HTML',
    category: 'frontend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['html', 'html5', 'markup', 'css & html fundamentals', 'html & css'],
    parents: ['frontend_frameworks'],
    children: []
  },
  'css': {
    id: 'css',
    canonicalName: 'CSS',
    category: 'frontend',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['css', 'css3', 'styles', 'styling', 'css & html fundamentals'],
    parents: ['frontend_frameworks'],
    children: []
  },

  // ==========================================
  // DATA SCIENCE, BI & ANALYTICS
  // ==========================================
  'data_analytics': {
    id: 'data_analytics',
    canonicalName: 'Data Analytics',
    category: 'data_ai',
    domain: 'DATA_ANALYTICS',
    // NOTE: bare 'analytics' is deliberately absent -- it fires inside product
    // names ("Google Analytics") and collapses specifics into this parent.
    aliases: ['data analysis', 'data transformation', 'data visualization fundamentals', 'data analytics'],
    parents: [],
    children: ['sql', 'pandas', 'numpy', 'power_bi', 'tableau', 'excel_analytics']
  },
  'pandas': {
    id: 'pandas',
    canonicalName: 'Pandas',
    category: 'data_ai',
    domain: 'DATA_ANALYTICS',
    aliases: ['pandas', 'python pandas', 'pandas library'],
    parents: ['data_analytics', 'python'],
    children: []
  },
  'numpy': {
    id: 'numpy',
    canonicalName: 'NumPy',
    category: 'data_ai',
    domain: 'DATA_ANALYTICS',
    aliases: ['numpy', 'python numpy', 'numpy library'],
    parents: ['data_analytics', 'python'],
    children: []
  },
  'power_bi': {
    id: 'power_bi',
    canonicalName: 'Power BI',
    category: 'data_ai',
    domain: 'DATA_ANALYTICS',
    aliases: ['power bi', 'powerbi', 'dax', 'power bi dashboarding', 'power bi dashboarding & dax'],
    parents: ['data_analytics'],
    children: []
  },
  'tableau': {
    id: 'tableau',
    canonicalName: 'Tableau',
    category: 'data_ai',
    domain: 'DATA_ANALYTICS',
    aliases: ['tableau', 'tableau desktop', 'tableau visual analytics'],
    parents: ['data_analytics'],
    children: []
  },

  // ==========================================
  // DEVOPS & CLOUD
  // ==========================================
  'cloud_platforms': {
    id: 'cloud_platforms',
    canonicalName: 'Cloud Platforms',
    category: 'devops_cloud',
    domain: 'CLOUD_DEVOPS',
    aliases: ['cloud computing', 'cloud infrastructure', 'cloud platforms'],
    parents: [],
    children: ['aws', 'azure', 'gcp']
  },
  'aws': {
    id: 'aws',
    canonicalName: 'AWS',
    category: 'devops_cloud',
    domain: 'CLOUD_DEVOPS',
    aliases: ['aws', 'amazon web services', 'aws cloud fundamentals', 'aws cloud'],
    parents: ['cloud_platforms'],
    children: []
  },
  'docker': {
    id: 'docker',
    canonicalName: 'Docker',
    category: 'devops_cloud',
    domain: 'CLOUD_DEVOPS',
    aliases: ['docker', 'containerization', 'ml model deployment & docker', 'docker containers'],
    parents: [],
    children: []
  },

  // ==========================================
  // TOOLS & WORKFLOW
  // ==========================================
  'github': {
    id: 'github',
    canonicalName: 'GitHub',
    category: 'tools',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['github', 'github repositories', 'git & github'],
    parents: ['git'],
    children: []
  },
  'git': {
    id: 'git',
    canonicalName: 'Git',
    category: 'tools',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['git', 'version control', 'git version control'],
    parents: [],
    children: ['github']
  },
  'vs_code': {
    id: 'vs_code',
    canonicalName: 'VS Code',
    category: 'tools',
    domain: 'SOFTWARE_ENGINEERING',
    aliases: ['vs code', 'vscode', 'visual studio code'],
    parents: [],
    children: []
  },

  // ==========================================
  // FITNESS & HEALTHCARE
  // ==========================================
  'fitness_training': {
    id: 'fitness_training',
    canonicalName: 'Personal Training & Fitness Coaching',
    category: 'domain_skill',
    domain: 'FITNESS_WELLNESS',
    aliases: ['personal trainer', 'personal training', 'fitness coaching', 'strength and conditioning', 'personal training & fitness instruction'],
    parents: [],
    children: ['nutrition_planning', 'cpr_first_aid']
  },
  'nutrition_planning': {
    id: 'nutrition_planning',
    canonicalName: 'Nutrition & Diet Planning',
    category: 'domain_skill',
    domain: 'FITNESS_WELLNESS',
    aliases: ['nutrition', 'diet planning', 'client nutritional counseling', 'nutrition & diet planning'],
    parents: ['fitness_training'],
    children: []
  },
  'cpr_first_aid': {
    id: 'cpr_first_aid',
    canonicalName: 'CPR & First Aid',
    category: 'domain_skill',
    domain: 'FITNESS_WELLNESS',
    aliases: ['cpr', 'first aid', 'aed certified', 'cpr & first aid'],
    parents: ['fitness_training'],
    children: []
  },

  // ==========================================
  // CIVIL SERVICES & PUBLIC ADMINISTRATION
  // ==========================================
  'civil_services_knowledge': {
    id: 'civil_services_knowledge',
    canonicalName: 'Civil Services General Studies & Public Administration',
    category: 'domain_skill',
    domain: 'CIVIL_GOVERNMENT',
    aliases: ['upsc', 'general studies', 'indian polity', 'public administration', 'ias preparation', 'general studies & csat prelims coverage', 'current affairs & national governance knowledge'],
    parents: [],
    children: []
  }
};

// ============================================================
// MULTI-DOMAIN ONTOLOGY EXTENSION
// ============================================================
// The ontology is a *canonicalisation and hierarchy* layer, NOT the gate that
// decides what may be extracted. Extraction is open-world (see
// resume_extraction.ts): anything the resume itself lists is preserved, and
// terms with no node here are kept as UNMAPPED_SKILL rather than discarded.
// Adding a node here upgrades a term from "preserved" to "understood".
//
// Alias discipline: aliases must be distinctive enough that they cannot fire
// on a non-resume document (an invoice, an article). Prefer 'operations
// management' over 'operations', 'cloud computing' over 'cloud'.

type NodeRow = [id: string, canonicalName: string, aliases: string[], extra?: Partial<OntologyNode>];

function addNodes(
  defaults: {
    category: OntologyNode['category'];
    domain: CareerDomainType;
    kind: SkillKind;
    subcategory: string;
  },
  rows: NodeRow[]
): void {
  for (const [id, canonicalName, aliases, extra] of rows) {
    SKILL_ONTOLOGY[id] = {
      id,
      canonicalName,
      aliases,
      category: defaults.category,
      domain: defaults.domain,
      kind: defaults.kind,
      subcategory: defaults.subcategory,
      parents: [],
      children: [],
      ...extra
    };
  }
}

// ---------- Business operations & management ----------
addNodes(
  { category: 'domain_skill', domain: 'BUSINESS_SALES', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Operations' },
  [
    ['operations_management', 'Operations Management', ['operations management', 'business operations', 'ops management', 'operational management', 'operations manager'], { children: ['process_improvement', 'inventory_management', 'supply_chain_management', 'vendor_management'] }],
    ['inventory_management', 'Inventory Management', ['inventory management', 'inventory control', 'stock management', 'stock control'], { parents: ['operations_management'] }],
    ['supply_chain_management', 'Supply Chain Management', ['supply chain', 'supply chain management', 'logistics management', 'warehouse management', 'demand planning'], { parents: ['operations_management'] }],
    ['vendor_management', 'Vendor Management', ['vendor management', 'supplier management', 'procurement', 'sourcing and procurement'], { parents: ['operations_management'] }],
    ['production_planning', 'Production Planning', ['production planning', 'production scheduling', 'shop floor management', 'capacity planning'], { domain: 'ENGINEERING_TRADES' }],
    ['store_operations', 'Retail Store Operations', ['store operations', 'retail operations', 'shrinkage control', 'store management'] ],
    ['front_office_operations', 'Front Office Operations', ['front office', 'front desk', 'guest relations', 'reception management'] ],
    ['food_beverage_service', 'Food & Beverage Service', ['food and beverage', 'f&b service', 'banquet operations', 'restaurant operations'] ],
    ['route_planning', 'Route & Dispatch Planning', ['route planning', 'dispatch planning', 'transport planning', 'fleet management', 'shipment tracking'] ],
    ['export_import_documentation', 'Export & Import Documentation', ['export documentation', 'import documentation', 'customs clearance', 'freight forwarding'] ]
  ]
);

addNodes(
  { category: 'domain_skill', domain: 'BUSINESS_SALES', kind: 'METHODOLOGY', subcategory: 'Methodology' },
  [
    ['process_improvement', 'Process Improvement', ['process improvement', 'process optimization', 'process optimisation', 'continuous improvement', 'workflow optimization', 'process re-engineering', 'sop development'], { parents: ['operations_management'] }],
    ['lean_six_sigma', 'Lean Six Sigma', ['six sigma', 'lean six sigma', 'lean manufacturing', 'kaizen', 'root cause analysis'], { parents: ['process_improvement'] }],
    ['project_management', 'Project Management', ['project management', 'project planning', 'project coordination', 'project delivery'], { children: ['agile_scrum'] }],
    ['agile_scrum', 'Agile & Scrum', ['agile', 'scrum', 'kanban', 'agile methodology', 'scrum master', 'sprint planning'], { parents: ['project_management'], domain: 'SOFTWARE_ENGINEERING' }],
    ['quality_assurance', 'Quality Assurance', ['quality assurance', 'quality control', 'quality management', 'quality audits'] ],
    ['business_analysis', 'Business Analysis', ['business analysis', 'requirements gathering', 'requirement analysis', 'gap analysis', 'process mapping'] ],
    ['strategic_planning', 'Strategic Planning', ['strategic planning', 'business strategy', 'go-to-market strategy', 'growth strategy'] ],
    ['budgeting', 'Budgeting', ['budgeting', 'budget management', 'cost control', 'cost management', 'cost optimization'], { domain: 'FINANCE_BANKING' }],
    ['product_management', 'Product Management', ['product management', 'product roadmap', 'product owner', 'product discovery'], { domain: 'SOFTWARE_ENGINEERING' }],
    ['research_methodology', 'Research Methodology', ['research methodology', 'literature review', 'qualitative research', 'quantitative research', 'survey design'], { domain: 'EDUCATION_RESEARCH' }]
  ]
);

// ---------- Sales, CRM & customer ----------
addNodes(
  { category: 'domain_skill', domain: 'BUSINESS_SALES', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Sales & Customer' },
  [
    ['sales', 'Sales', ['sales', 'b2b sales', 'b2c sales', 'inside sales', 'field sales', 'sales management', 'selling'], { children: ['sales_coordination', 'lead_generation', 'account_management'] }],
    ['sales_coordination', 'Sales Coordination', ['sales coordination', 'sales coordinator', 'sales support', 'sales operations', 'coordinated sales teams'], { parents: ['sales'] }],
    ['lead_generation', 'Lead Generation', ['lead generation', 'prospecting', 'lead qualification', 'cold calling', 'pipeline generation'], { parents: ['sales'] }],
    ['account_management', 'Account Management', ['account management', 'key account management', 'client relations', 'client relationship management', 'customer accounts', 'customer account management'], { parents: ['sales'] }],
    ['customer_success', 'Customer Success', ['customer success', 'client success', 'customer retention', 'customer onboarding', 'churn reduction', 'renewals management'] ],
    ['customer_service', 'Customer Service', ['customer service', 'customer support', 'client servicing', 'helpdesk support', 'grievance handling'] ],
    ['stakeholder_management', 'Stakeholder Management', ['stakeholder management', 'stakeholder engagement', 'stakeholder communication', 'cross-functional coordination'] ],
    ['business_development', 'Business Development', ['business development', 'partnership development', 'client acquisition', 'entrepreneurship', 'startup operations'] ],
    ['crm', 'Customer Relationship Management', ['crm', 'customer relationship management', 'crm management'], { children: ['hubspot_crm', 'salesforce', 'zoho_crm'] }],
    ['merchandising', 'Merchandising', ['merchandising', 'visual merchandising', 'planogram', 'category management'] ]
  ]
);

addNodes(
  { category: 'tools', domain: 'BUSINESS_SALES', kind: 'PLATFORM', subcategory: 'CRM & Sales Platforms' },
  [
    ['hubspot_crm', 'HubSpot CRM', ['hubspot', 'hubspot crm', 'hubspot sales hub'], { parents: ['crm'] }],
    ['salesforce', 'Salesforce', ['salesforce', 'salesforce crm', 'sfdc'], { parents: ['crm'] }],
    ['zoho_crm', 'Zoho CRM', ['zoho', 'zoho crm'], { parents: ['crm'] }],
    ['freshworks_crm', 'Freshworks CRM', ['freshworks', 'freshsales', 'freshdesk'], { parents: ['crm'] }],
    ['sap_erp', 'SAP ERP', ['sap', 'sap erp', 'sap fico', 'sap mm'] ],
    ['pos_systems', 'Point of Sale Systems', ['point of sale', 'pos systems', 'billing systems'] ]
  ]
);

// ---------- Marketing ----------
addNodes(
  { category: 'domain_skill', domain: 'BUSINESS_SALES', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Marketing' },
  [
    ['digital_marketing', 'Digital Marketing', ['digital marketing', 'online marketing', 'performance marketing', 'growth marketing'], { children: ['seo', 'sem', 'email_marketing', 'social_media_marketing', 'content_marketing', 'campaign_tracking'] }],
    ['seo', 'Search Engine Optimization', ['seo', 'search engine optimization', 'search engine optimisation', 'on-page seo', 'off-page seo', 'technical seo', 'keyword research'], { parents: ['digital_marketing'] }],
    ['sem', 'Search Engine Marketing', ['sem', 'search engine marketing', 'google ads', 'adwords', 'paid search', 'ppc', 'pay per click'], { parents: ['digital_marketing'] }],
    ['email_marketing', 'Email Marketing', ['email marketing', 'email campaigns', 'newsletter marketing', 'drip campaigns', 'email automation'], { parents: ['digital_marketing'] }],
    ['social_media_marketing', 'Social Media Marketing', ['social media', 'social media marketing', 'social media management', 'smm', 'community management'], { parents: ['digital_marketing'] }],
    ['content_marketing', 'Content Marketing', ['content marketing', 'content strategy', 'content creation'], { parents: ['digital_marketing'], children: ['content_writing', 'content_planning'] }],
    // Kept distinct from Content Marketing: planning a calendar is a narrower
    // capability than owning content marketing, and collapsing the two would
    // overstate the candidate.
    ['content_planning', 'Content Planning', ['content planning', 'content calendar', 'editorial calendar', 'content scheduling'], { parents: ['content_marketing'] }],
    ['campaign_tracking', 'Campaign Tracking', ['campaign tracking', 'campaign performance', 'campaign analytics', 'campaign reporting', 'campaign management', 'tracked campaign performance'], { parents: ['digital_marketing'] }],
    ['brand_management', 'Brand Management', ['brand management', 'branding', 'brand strategy', 'brand identity'] ],
    ['market_research', 'Market Research', ['market research', 'competitor analysis', 'competitive analysis', 'consumer research'] ],
    ['public_relations', 'Public Relations', ['public relations', 'media relations', 'press releases', 'corporate communications'], { domain: 'CREATIVE_DESIGN' }],
    ['content_writing', 'Content Writing', ['content writing', 'copywriting', 'blog writing', 'technical writing', 'copy editing', 'proofreading'], { domain: 'CREATIVE_DESIGN', parents: ['content_marketing'] }]
  ]
);

// ---------- Analytics, reporting & BI ----------
addNodes(
  { category: 'data_ai', domain: 'DATA_ANALYTICS', kind: 'SKILL', subcategory: 'Analytics' },
  [
    ['business_analytics', 'Business Analytics', ['business analytics', 'business intelligence', 'bi reporting'], { parents: ['data_analytics'] }],
    ['kpi_reporting', 'KPI Reporting', ['kpi reporting', 'kpi reports', 'kpi tracking', 'kpi dashboards', 'key performance indicators', 'mis reporting', 'reporting', 'report preparation', 'weekly reports', 'performance reporting'], { parents: ['data_analytics'] }],
    ['data_cleaning', 'Data Cleaning', ['data cleaning', 'data cleansing', 'data wrangling', 'data preparation', 'data scrubbing', 'data quality'], { parents: ['data_analytics'] }],
    ['data_visualization', 'Data Visualization', ['data visualization', 'data visualisation', 'dashboarding', 'dashboard development', 'data storytelling'], { parents: ['data_analytics'] }],
    ['statistical_analysis', 'Statistical Analysis', ['statistical analysis', 'statistics', 'hypothesis testing', 'regression analysis', 'a/b testing'], { parents: ['data_analytics'] }],
    ['customer_analytics', 'Customer Analytics', ['customer analytics', 'customer segmentation', 'cohort analysis', 'retention analysis', 'repeat purchase analysis'], { parents: ['data_analytics'] }],
    ['forecasting', 'Forecasting', ['forecasting', 'demand forecasting', 'sales forecasting', 'trend analysis'], { parents: ['data_analytics'] }],
    ['etl', 'ETL & Data Pipelines', ['etl', 'data pipeline', 'data pipelines', 'elt', 'data ingestion'], { parents: ['data_analytics'] }],
    ['machine_learning', 'Machine Learning', ['machine learning', 'ml', 'ai/ml', 'supervised learning', 'predictive modeling', 'deep learning'], { domain: 'AI_ML', children: ['scikit_learn', 'tensorflow', 'pytorch', 'nlp', 'computer_vision'] }],
    ['nlp', 'Natural Language Processing', ['nlp', 'natural language processing', 'text mining'], { domain: 'AI_ML', parents: ['machine_learning'] }],
    ['computer_vision', 'Computer Vision', ['computer vision', 'image processing', 'object detection'], { domain: 'AI_ML', parents: ['machine_learning'] }]
  ]
);

addNodes(
  { category: 'tools', domain: 'DATA_ANALYTICS', kind: 'TOOL', subcategory: 'Analytics Tools' },
  [
    ['excel', 'Microsoft Excel', ['excel', 'ms excel', 'microsoft excel', 'advanced excel', 'excel spreadsheets', 'pivot tables', 'vlookup', 'excel dashboard'], { parents: ['data_analytics'] }],
    ['google_sheets', 'Google Sheets', ['google sheets', 'gsheets', 'g-sheets', 'spreadsheets'], { parents: ['data_analytics'] }],
    ['google_analytics', 'Google Analytics', ['google analytics', 'ga4', 'google analytics 4', 'universal analytics'], { parents: ['data_analytics', 'digital_marketing'], kind: 'PLATFORM' }],
    ['looker_studio', 'Looker Studio', ['looker studio', 'google data studio', 'data studio', 'looker'], { parents: ['data_visualization'] }],
    ['scikit_learn', 'scikit-learn', ['scikit-learn', 'scikit learn', 'sklearn'], { parents: ['machine_learning'], domain: 'AI_ML' }],
    ['tensorflow', 'TensorFlow', ['tensorflow', 'keras'], { parents: ['machine_learning'], domain: 'AI_ML' }],
    ['pytorch', 'PyTorch', ['pytorch', 'torch'], { parents: ['machine_learning'], domain: 'AI_ML' }],
    ['matplotlib', 'Matplotlib', ['matplotlib', 'seaborn', 'plotly'], { parents: ['data_visualization'] }],
    ['spss', 'SPSS', ['spss', 'ibm spss'] ],
    ['sas_analytics', 'SAS', ['sas analytics', 'sas programming'] ],
    ['r_language', 'R', ['r programming', 'r language', 'rstudio'], { category: 'programming_language', kind: 'SKILL' }]
  ]
);

// ---------- Office, productivity & collaboration tooling ----------
addNodes(
  { category: 'tools', domain: 'GENERAL', kind: 'TOOL', subcategory: 'Productivity Tools' },
  [
    ['ms_office', 'Microsoft Office', ['ms office', 'microsoft office', 'office 365', 'm365'], { children: ['excel', 'powerpoint', 'ms_word'] }],
    ['powerpoint', 'Microsoft PowerPoint', ['powerpoint', 'ms powerpoint', 'microsoft powerpoint'], { parents: ['ms_office'] }],
    ['ms_word', 'Microsoft Word', ['ms word', 'microsoft word'], { parents: ['ms_office'] }],
    ['google_workspace', 'Google Workspace', ['google workspace', 'g suite', 'gsuite', 'google docs', 'google drive'], { kind: 'PLATFORM' }],
    ['notion', 'Notion', ['notion', 'notion.so'] ],
    ['trello', 'Trello', ['trello'] ],
    ['asana', 'Asana', ['asana'] ],
    ['jira', 'Jira', ['jira', 'atlassian jira'], { domain: 'SOFTWARE_ENGINEERING' }],
    ['confluence', 'Confluence', ['confluence'], { domain: 'SOFTWARE_ENGINEERING' }],
    ['clickup', 'ClickUp', ['clickup'] ],
    ['monday_com', 'Monday.com', ['monday.com'] ],
    ['slack', 'Slack', ['slack'], { kind: 'PLATFORM' }],
    ['ms_teams', 'Microsoft Teams', ['microsoft teams', 'ms teams'], { kind: 'PLATFORM' }],
    ['zoom', 'Zoom', ['zoom video', 'zoom meetings'], { kind: 'PLATFORM' }],
    ['ms_project', 'Microsoft Project', ['ms project', 'microsoft project'], { parents: ['project_management'] }],
    ['mailchimp', 'Mailchimp', ['mailchimp'], { parents: ['email_marketing'], kind: 'PLATFORM', domain: 'BUSINESS_SALES' }]
  ]
);

// ---------- Finance & accounting ----------
addNodes(
  { category: 'domain_skill', domain: 'FINANCE_BANKING', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Finance & Accounting' },
  [
    ['accounting', 'Accounting', ['accounting', 'bookkeeping', 'book keeping', 'general ledger', 'journal entries'], { children: ['accounts_payable_receivable', 'financial_reporting', 'taxation', 'payroll'] }],
    ['accounts_payable_receivable', 'Accounts Payable & Receivable', ['accounts payable', 'accounts receivable', 'ap/ar', 'vendor reconciliation'], { parents: ['accounting'] }],
    ['financial_reporting', 'Financial Reporting', ['financial reporting', 'financial statements', 'balance sheet preparation', 'profit and loss statements'], { parents: ['accounting'] }],
    ['financial_analysis', 'Financial Analysis', ['financial analysis', 'financial modeling', 'financial modelling', 'valuation', 'variance analysis'] ],
    ['taxation', 'Taxation', ['taxation', 'tax filing', 'gst', 'gst filing', 'income tax', 'tds', 'tax compliance'], { parents: ['accounting'] }],
    ['auditing', 'Auditing', ['auditing', 'internal audit', 'statutory audit', 'audit support'], { parents: ['accounting'] }],
    ['payroll', 'Payroll', ['payroll', 'payroll processing', 'salary processing'], { parents: ['accounting'] }],
    ['risk_management', 'Risk Management', ['risk management', 'credit risk', 'risk assessment', 'risk mitigation'] ],
    ['banking_operations', 'Banking Operations', ['banking operations', 'retail banking', 'kyc', 'loan processing', 'branch operations'] ]
  ]
);

addNodes(
  { category: 'tools', domain: 'FINANCE_BANKING', kind: 'TOOL', subcategory: 'Finance Tools' },
  [
    ['tally', 'Tally', ['tally', 'tally erp', 'tally prime', 'tally erp 9'] ],
    ['quickbooks', 'QuickBooks', ['quickbooks', 'quick books'] ],
    ['zoho_books', 'Zoho Books', ['zoho books'] ]
  ]
);

// ---------- HR & recruitment ----------
addNodes(
  { category: 'domain_skill', domain: 'BUSINESS_SALES', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Human Resources' },
  [
    ['recruitment', 'Recruitment', ['recruitment', 'recruiting', 'talent acquisition', 'technical recruiting', 'candidate sourcing', 'end-to-end recruitment'] ],
    ['employee_onboarding', 'Employee Onboarding', ['employee onboarding', 'induction', 'joining formalities'] ],
    ['hr_operations', 'HR Operations', ['hr operations', 'human resources', 'hr administration', 'hris', 'employee records', 'attendance management'] ],
    ['performance_management', 'Performance Management', ['performance management', 'performance appraisal', 'performance reviews', 'kra setting'] ],
    ['employee_engagement', 'Employee Engagement', ['employee engagement', 'employee relations', 'hr policies', 'grievance redressal'] ],
    ['compensation_benefits', 'Compensation & Benefits', ['compensation and benefits', 'benefits administration', 'salary benchmarking'] ],
    ['learning_development', 'Learning & Development', ['learning and development', 'training and development', 'employee training', 'corporate training'] ]
  ]
);

addNodes(
  { category: 'tools', domain: 'BUSINESS_SALES', kind: 'PLATFORM', subcategory: 'HR Platforms' },
  [
    ['ats', 'Applicant Tracking System', ['applicant tracking system', 'ats', 'greenhouse ats', 'lever ats'] ],
    ['linkedin_recruiter', 'LinkedIn Recruiter', ['linkedin recruiter', 'naukri recruiter'] ],
    ['workday', 'Workday', ['workday'] ]
  ]
);

// ---------- Healthcare ----------
addNodes(
  { category: 'domain_skill', domain: 'HEALTHCARE_MEDICINE', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Clinical' },
  [
    ['patient_care', 'Patient Care', ['patient care', 'patient management', 'bedside care', 'nursing care', 'patient counselling'] ],
    ['clinical_documentation', 'Clinical Documentation', ['clinical documentation', 'medical records', 'emr', 'ehr', 'electronic health records', 'case sheets'] ],
    ['medical_coding', 'Medical Coding', ['medical coding', 'icd-10', 'cpt coding', 'medical billing'] ],
    ['pharmacology', 'Pharmacology', ['pharmacology', 'medication administration', 'drug dispensing', 'pharmacy operations'] ],
    ['phlebotomy', 'Phlebotomy', ['phlebotomy', 'venipuncture', 'sample collection'] ],
    ['patient_monitoring', 'Patient Monitoring', ['vital signs', 'patient monitoring', 'triage', 'icu monitoring'] ],
    ['infection_control', 'Infection Control', ['infection control', 'sterilization', 'aseptic technique', 'biomedical waste management'] ],
    ['physiotherapy', 'Physiotherapy', ['physiotherapy', 'physical therapy', 'rehabilitation therapy'] ],
    ['medical_lab_techniques', 'Medical Laboratory Techniques', ['medical laboratory', 'lab techniques', 'pathology testing', 'diagnostic testing'] ]
  ]
);

// ---------- Education & research ----------
addNodes(
  { category: 'domain_skill', domain: 'EDUCATION_RESEARCH', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Teaching & Research' },
  [
    ['teaching', 'Teaching', ['teaching', 'classroom instruction', 'lesson delivery', 'tutoring', 'faculty'] ],
    ['curriculum_development', 'Curriculum Development', ['curriculum development', 'curriculum design', 'lesson planning', 'syllabus design', 'courseware development'] ],
    ['student_assessment', 'Student Assessment', ['student assessment', 'grading', 'exam evaluation', 'student evaluation'] ],
    ['classroom_management', 'Classroom Management', ['classroom management', 'behaviour management', 'student mentoring'] ],
    ['e_learning', 'E-Learning Delivery', ['e-learning', 'online teaching', 'lms', 'moodle', 'google classroom'] ],
    ['academic_writing', 'Academic Writing', ['academic writing', 'research paper writing', 'thesis writing', 'publication writing'] ],
    ['data_collection', 'Field Data Collection', ['data collection', 'field research', 'field survey', 'primary data collection'] ]
  ]
);

// ---------- Law, policy & government ----------
addNodes(
  { category: 'domain_skill', domain: 'LAW_PUBLIC_POLICY', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Legal' },
  [
    ['legal_research', 'Legal Research', ['legal research', 'case law research', 'legal drafting', 'legal opinions'] ],
    ['contract_management', 'Contract Management', ['contract management', 'contract drafting', 'contract review', 'contract negotiation'] ],
    ['regulatory_compliance', 'Regulatory Compliance', ['regulatory compliance', 'statutory compliance', 'compliance management', 'aml compliance'] ],
    ['litigation', 'Litigation Support', ['litigation', 'court proceedings', 'case management', 'client briefing'] ],
    ['intellectual_property', 'Intellectual Property', ['intellectual property', 'trademark filing', 'patent filing', 'ip law'] ]
  ]
);

addNodes(
  { category: 'domain_skill', domain: 'CIVIL_GOVERNMENT', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Public Administration' },
  [
    ['indian_polity', 'Indian Polity', ['indian polity', 'constitution of india', 'polity and governance'], { parents: ['civil_services_knowledge'] }],
    ['current_affairs', 'Current Affairs', ['current affairs', 'general awareness', 'national governance knowledge'], { parents: ['civil_services_knowledge'] }],
    ['csat_aptitude', 'CSAT & Aptitude', ['csat', 'quantitative aptitude', 'logical reasoning', 'aptitude and reasoning'], { parents: ['civil_services_knowledge'] }],
    ['answer_writing', 'Answer & Essay Writing', ['answer writing', 'essay writing', 'mains answer writing'], { parents: ['civil_services_knowledge'] }],
    ['public_policy', 'Public Policy', ['public policy', 'policy analysis', 'governance reforms'] ],
    ['office_procedure', 'Government Office Procedure', ['file noting', 'office procedure', 'rti handling', 'noting and drafting'] ],
    ['community_outreach', 'Community Outreach', ['community outreach', 'volunteer management', 'csr', 'beneficiary mobilisation'] ],
    ['fundraising', 'Fundraising', ['fundraising', 'grant writing', 'donor management'] ]
  ]
);

// ---------- Design & creative ----------
addNodes(
  { category: 'domain_skill', domain: 'CREATIVE_DESIGN', kind: 'SKILL', subcategory: 'Design' },
  [
    ['graphic_design', 'Graphic Design', ['graphic design', 'visual design', 'brand identity design', 'poster design'] ],
    ['ui_ux_design', 'UI/UX Design', ['ui/ux', 'ux design', 'ui design', 'user experience design', 'user interface design', 'interaction design'], { children: ['wireframing', 'prototyping'] }],
    ['wireframing', 'Wireframing', ['wireframing', 'wireframes', 'low-fidelity mockups'], { parents: ['ui_ux_design'] }],
    ['prototyping', 'Prototyping', ['prototyping', 'clickable prototypes', 'high-fidelity prototypes'], { parents: ['ui_ux_design'] }],
    ['user_research', 'User Research', ['user research', 'usability testing', 'user interviews'], { parents: ['ui_ux_design'] }],
    ['video_editing', 'Video Editing', ['video editing', 'video production', 'post production', 'motion graphics'] ],
    ['photography', 'Photography', ['photography', 'photo editing', 'product photography'] ],
    ['typography', 'Typography & Layout', ['typography', 'layout design', 'print layout'] ],
    ['three_d_modeling', '3D Modeling', ['3d modeling', '3d modelling', '3d rendering'] ],
    ['journalism', 'Journalism', ['journalism', 'news writing', 'editorial writing', 'news reporting'] ]
  ]
);

addNodes(
  { category: 'tools', domain: 'CREATIVE_DESIGN', kind: 'TOOL', subcategory: 'Design Tools' },
  [
    ['canva', 'Canva', ['canva'] ],
    ['figma', 'Figma', ['figma', 'figjam'], { parents: ['ui_ux_design'] }],
    ['adobe_photoshop', 'Adobe Photoshop', ['photoshop', 'adobe photoshop'] ],
    ['adobe_illustrator', 'Adobe Illustrator', ['illustrator', 'adobe illustrator'] ],
    ['adobe_xd', 'Adobe XD', ['adobe xd'], { parents: ['ui_ux_design'] }],
    ['adobe_premiere', 'Adobe Premiere Pro', ['premiere pro', 'adobe premiere'], { parents: ['video_editing'] }],
    ['after_effects', 'Adobe After Effects', ['after effects', 'adobe after effects'], { parents: ['video_editing'] }],
    ['coreldraw', 'CorelDRAW', ['coreldraw', 'corel draw'] ],
    ['blender', 'Blender', ['blender'], { parents: ['three_d_modeling'] }],
    ['sketch_app', 'Sketch', ['sketch app'], { parents: ['ui_ux_design'] }]
  ]
);

// ---------- Engineering, construction & manufacturing ----------
addNodes(
  { category: 'domain_skill', domain: 'ENGINEERING_TRADES', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Engineering & Trades' },
  [
    ['structural_design', 'Structural Design', ['structural design', 'structural analysis', 'rcc design', 'steel design'] ],
    ['site_supervision', 'Site Supervision', ['site supervision', 'site execution', 'construction supervision', 'site engineer'] ],
    ['quantity_surveying', 'Quantity Surveying', ['quantity surveying', 'boq', 'bill of quantities', 'estimation and costing'] ],
    ['cnc_machining', 'CNC Machining', ['cnc', 'cnc machining', 'lathe operation', 'vmc operation'] ],
    ['preventive_maintenance', 'Preventive Maintenance', ['preventive maintenance', 'equipment maintenance', 'breakdown maintenance', 'plant maintenance'] ],
    ['welding_fabrication', 'Welding & Fabrication', ['welding', 'fabrication', 'sheet metal fabrication'] ],
    ['industrial_automation', 'Industrial Automation', ['industrial automation', 'plc', 'scada', 'plc programming'] ],
    ['hse_safety', 'Health & Safety Compliance', ['hse', 'workplace safety', 'safety compliance', 'ehs'] ]
  ]
);

addNodes(
  { category: 'tools', domain: 'ENGINEERING_TRADES', kind: 'TOOL', subcategory: 'Engineering Tools' },
  [
    ['autocad', 'AutoCAD', ['autocad', 'auto cad'] ],
    ['revit', 'Revit', ['revit', 'autodesk revit', 'bim modelling'] ],
    ['solidworks', 'SolidWorks', ['solidworks', 'solid works'] ],
    ['catia', 'CATIA', ['catia'] ],
    ['staad_pro', 'STAAD.Pro', ['staad pro', 'staad.pro'] ],
    ['ansys', 'ANSYS', ['ansys'] ],
    ['primavera', 'Primavera P6', ['primavera', 'primavera p6'], { parents: ['project_management'] }]
  ]
);

// ---------- Additional technology nodes ----------
addNodes(
  { category: 'backend', domain: 'SOFTWARE_ENGINEERING', kind: 'SKILL', subcategory: 'Backend' },
  [
    ['flask', 'Flask', ['flask'], { parents: ['backend_frameworks', 'python'] }],
    ['fastapi', 'FastAPI', ['fastapi', 'fast api'], { parents: ['backend_frameworks', 'python'] }],
    ['spring_boot', 'Spring Boot', ['spring boot', 'spring framework', 'spring mvc'], { parents: ['backend_frameworks', 'java'] }],
    ['rest_api', 'REST APIs', ['rest api', 'rest apis', 'restful apis', 'restful api', 'api development'], { parents: ['backend_frameworks'] }],
    ['graphql', 'GraphQL', ['graphql'], { parents: ['backend_frameworks'] }],
    ['microservices', 'Microservices', ['microservices', 'microservice architecture'], { parents: ['backend_frameworks'] }],
    ['oop', 'Object Oriented Programming', ['object oriented programming', 'oop', 'oops concepts'], { category: 'programming_language', parents: ['programming_languages'] }],
    ['data_structures', 'Data Structures & Algorithms', ['data structures', 'algorithms', 'dsa', 'data structures and algorithms'], { category: 'programming_language', parents: ['programming_languages'] }]
  ]
);

addNodes(
  { category: 'programming_language', domain: 'SOFTWARE_ENGINEERING', kind: 'SKILL', subcategory: 'Languages' },
  [
    ['c_sharp', 'C#', ['c#', 'csharp', 'c sharp'], { parents: ['programming_languages'] }],
    ['go', 'Go', ['golang', 'go language'], { parents: ['programming_languages'] }],
    ['rust', 'Rust', ['rust lang', 'rust programming'], { parents: ['programming_languages'] }],
    ['php', 'PHP', ['php'], { parents: ['programming_languages'] }],
    ['ruby', 'Ruby', ['ruby', 'ruby on rails'], { parents: ['programming_languages'] }],
    ['kotlin', 'Kotlin', ['kotlin'], { parents: ['programming_languages'] }],
    ['swift', 'Swift', ['swift programming'], { parents: ['programming_languages'] }],
    ['shell_scripting', 'Shell Scripting', ['shell scripting', 'bash scripting', 'powershell scripting'], { parents: ['programming_languages'] }]
  ]
);

addNodes(
  { category: 'devops_cloud', domain: 'CLOUD_DEVOPS', kind: 'SKILL', subcategory: 'Cloud & DevOps' },
  [
    ['kubernetes', 'Kubernetes', ['kubernetes', 'k8s'], { parents: ['cloud_platforms'] }],
    ['azure', 'Microsoft Azure', ['azure', 'microsoft azure'], { parents: ['cloud_platforms'] }],
    ['gcp', 'Google Cloud Platform', ['gcp', 'google cloud', 'google cloud platform'], { parents: ['cloud_platforms'] }],
    ['ci_cd', 'CI/CD', ['ci/cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions'] ],
    ['terraform', 'Terraform', ['terraform', 'infrastructure as code'] ],
    ['linux', 'Linux', ['linux', 'unix', 'linux administration'] ],
    ['networking', 'Computer Networking', ['computer networking', 'tcp/ip', 'ccna', 'network administration', 'lan/wan'], { domain: 'IT_NETWORKING' }],
    ['cybersecurity', 'Cybersecurity', ['cybersecurity', 'information security', 'infosec', 'network security'], { domain: 'CYBERSECURITY' }],
    ['penetration_testing', 'Penetration Testing', ['penetration testing', 'ethical hacking', 'vapt'], { domain: 'CYBERSECURITY', parents: ['cybersecurity'] }]
  ]
);

addNodes(
  { category: 'frontend', domain: 'SOFTWARE_ENGINEERING', kind: 'SKILL', subcategory: 'Frontend' },
  [
    ['angular', 'Angular', ['angular', 'angularjs'], { parents: ['frontend_frameworks'] }],
    ['vue_js', 'Vue.js', ['vue.js', 'vuejs', 'vue'], { parents: ['frontend_frameworks'] }],
    ['tailwind_css', 'Tailwind CSS', ['tailwind', 'tailwind css'], { parents: ['css'] }],
    ['bootstrap', 'Bootstrap', ['bootstrap'], { parents: ['css'] }],
    ['responsive_design', 'Responsive Web Design', ['responsive design', 'responsive web design', 'mobile-first design'], { parents: ['frontend_frameworks'] }]
  ]
);

// ---------- Fitness (extend existing) ----------
addNodes(
  { category: 'domain_skill', domain: 'FITNESS_WELLNESS', kind: 'DOMAIN_KNOWLEDGE', subcategory: 'Fitness' },
  [
    ['group_fitness', 'Group Fitness Instruction', ['group fitness', 'group training', 'aerobics instruction'], { parents: ['fitness_training'] }],
    ['strength_conditioning', 'Strength & Conditioning', ['strength and conditioning', 'strength training', 'resistance training'], { parents: ['fitness_training'] }],
    ['client_progress_tracking', 'Client Progress Tracking', ['client progress tracking', 'fitness assessment', 'body composition analysis'], { parents: ['fitness_training'] }]
  ]
);

// ---------- Soft skills ----------
addNodes(
  { category: 'soft_skill', domain: 'GENERAL', kind: 'SOFT_SKILL', subcategory: 'Soft Skills' },
  [
    ['communication', 'Communication', ['communication', 'communication skills', 'verbal communication', 'written communication', 'public speaking'] ],
    ['team_collaboration', 'Team Collaboration', ['team collaboration', 'teamwork', 'collaboration', 'team player', 'cross-functional collaboration'] ],
    ['problem_solving', 'Problem Solving', ['problem solving', 'analytical thinking', 'critical thinking', 'troubleshooting'] ],
    ['time_management', 'Time Management', ['time management', 'prioritization', 'prioritisation', 'multitasking', 'meeting deadlines'] ],
    ['leadership', 'Leadership', ['leadership', 'team leadership', 'people management', 'mentoring', 'team handling'] ],
    ['presentation_skills', 'Presentation', ['presentation', 'presentation skills', 'business presentations', 'client presentations'] ],
    ['negotiation', 'Negotiation', ['negotiation', 'negotiation skills', 'deal negotiation'] ],
    ['adaptability', 'Adaptability', ['adaptability', 'flexibility', 'learning agility'] ],
    ['attention_to_detail', 'Attention to Detail', ['attention to detail', 'detail oriented', 'detail-oriented'] ],
    ['decision_making', 'Decision Making', ['decision making', 'decision-making'] ],
    ['conflict_resolution', 'Conflict Resolution', ['conflict resolution', 'conflict management'] ],
    ['emotional_intelligence', 'Emotional Intelligence', ['emotional intelligence', 'empathy'] ],
    ['creativity', 'Creativity', ['creativity', 'creative thinking', 'ideation', 'innovative thinking'] ],
    ['work_ethic', 'Work Ethic & Ownership', ['work ethic', 'self motivated', 'self-motivated', 'ownership mindset'] ],
    ['interpersonal_skills', 'Interpersonal Skills', ['interpersonal skills', 'relationship building', 'people skills'] ]
  ]
);

// ============================================================
// LOOKUP INDEXES
// ============================================================

const CATEGORY_DEFAULT_KIND: Record<OntologyNode['category'], SkillKind> = {
  database: 'SKILL',
  programming_language: 'SKILL',
  frontend: 'SKILL',
  backend: 'SKILL',
  devops_cloud: 'SKILL',
  data_ai: 'SKILL',
  tools: 'TOOL',
  domain_skill: 'DOMAIN_KNOWLEDGE',
  soft_skill: 'SOFT_SKILL',
  general: 'SKILL'
};

export function ontologyKind(node: OntologyNode): SkillKind {
  return node.kind || CATEGORY_DEFAULT_KIND[node.category] || 'SKILL';
}

/** Lowercase, punctuation-tolerant key used for exact term lookup. */
export function normalizeTermKey(term: string): string {
  return term
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9+#./&' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:]+$/, '');
}

let ALIAS_INDEX: Map<string, OntologyNode> | null = null;

/**
 * How strong is this node's claim on a term?
 *
 * Declaration order must NOT decide ownership: a broad umbrella node that
 * happens to list 'rest apis' or 'indian polity' among its aliases would
 * otherwise shadow the dedicated REST APIs / Indian Polity nodes and silently
 * widen the candidate's skill into its parent. Specific always beats general.
 */
function claimStrength(node: OntologyNode, term: string, isOwnName: boolean): number {
  let score = isOwnName ? 100 : 0;          // own id / canonical name outranks any alias
  score += node.parents.length > 0 ? 10 : 0; // a node with a parent is the narrower concept
  score -= Math.min(node.children.length, 9); // many children == umbrella node
  return score;
}

function getAliasIndex(): Map<string, OntologyNode> {
  if (ALIAS_INDEX) return ALIAS_INDEX;
  const index = new Map<string, OntologyNode>();
  const strengths = new Map<string, number>();

  for (const node of Object.values(SKILL_ONTOLOGY)) {
    const ownNames = new Set([normalizeTermKey(node.id), normalizeTermKey(node.canonicalName)]);
    for (const key of [node.id, node.canonicalName, ...node.aliases]) {
      const norm = normalizeTermKey(key);
      if (!norm) continue;
      const strength = claimStrength(node, norm, ownNames.has(norm));
      if (!index.has(norm) || strength > (strengths.get(norm) ?? -Infinity)) {
        index.set(norm, node);
        strengths.set(norm, strength);
      }
    }
  }

  ALIAS_INDEX = index;
  return index;
}

/**
 * EXACT canonical lookup. Unlike findOntologyNode (which does fuzzy substring
 * matching and is used for requirement<->skill matching), this never collapses
 * a specific term into a broader relative: "SEO Fundamentals" does NOT resolve
 * to Digital Marketing, and "Microsoft Excel" does NOT resolve to Data
 * Analytics. Extraction uses this so specificity survives normalization.
 */
export function findOntologyNodeExact(term: string): OntologyNode | undefined {
  if (!term) return undefined;
  return getAliasIndex().get(normalizeTermKey(term));
}

export interface OntologyAliasEntry {
  alias: string;
  node: OntologyNode;
}

let SCANNABLE_ALIASES: OntologyAliasEntry[] | null = null;

/**
 * All ontology aliases, longest first, for scanning free-text prose.
 * Single/double character aliases are excluded -- they generate false
 * positives ("C" inside "CSE", "R" inside anything).
 */
export function getScannableAliases(): OntologyAliasEntry[] {
  if (SCANNABLE_ALIASES) return SCANNABLE_ALIASES;

  // Every alias resolves through the SAME ownership rule as exact lookup, so a
  // term cannot mean one node when typed and a broader node when found in prose.
  const index = getAliasIndex();
  const entries: OntologyAliasEntry[] = [];
  Array.from(index.entries()).forEach(([alias, node]) => {
    if (alias.length < 3) return;
    entries.push({ alias, node });
  });

  entries.sort((a, b) => b.alias.length - a.alias.length);
  SCANNABLE_ALIASES = entries;
  return entries;
}

/** Walk up the parent chain to the most general ancestor of a node. */
export function getRootAncestor(node: OntologyNode): OntologyNode {
  let current = node;
  const guard = new Set<string>([node.id]);
  while (current.parents.length > 0) {
    const parent = SKILL_ONTOLOGY[current.parents[0]];
    if (!parent || guard.has(parent.id)) break;
    guard.add(parent.id);
    current = parent;
  }
  return current;
}

/**
 * Look up ontology node by raw alias or canonical ID, with token & substring intelligence
 */
export function findOntologyNode(skillOrReqName: string): OntologyNode | undefined {
  if (!skillOrReqName) return undefined;
  const lower = skillOrReqName.toLowerCase().trim();

  // 1. Direct ID match
  if (SKILL_ONTOLOGY[lower]) {
    return SKILL_ONTOLOGY[lower];
  }

  // 2. Scan exact canonical names & aliases
  for (const node of Object.values(SKILL_ONTOLOGY)) {
    if (node.canonicalName.toLowerCase() === lower) return node;
    if (node.aliases.some(a => a.toLowerCase() === lower)) return node;
  }

  // 3. Keyword / Substring token matching (e.g. "SQL Querying & Data Extraction" -> matches 'sql')
  const allNodes = Object.values(SKILL_ONTOLOGY);

  // Sort nodes by canonical name length descending to match most specific node first (e.g. PostgreSQL before SQL)
  allNodes.sort((a, b) => b.canonicalName.length - a.canonicalName.length);

  for (const node of allNodes) {
    // Check if node aliases appear as distinct phrase/word in requirement
    for (const alias of node.aliases) {
      if (alias.length >= 3) {
        const regex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
          return node;
        }
      }
    }

    // Check canonical name
    if (node.canonicalName.length >= 3) {
      const regex = new RegExp(`\\b${node.canonicalName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        return node;
      }
    }
  }

  return undefined;
}

export interface OntologyMatchResult {
  isMatch: boolean;
  matchType: MatchType;
  matchScore: number;
  matchedSkills: string[];
  explanation: string;
  isPartial: boolean;
  missingAspects?: string;
}

/**
 * Evaluates whether candidate's extracted skills satisfy a requirement through ontology relationships.
 */
export function evaluateOntologyRelationship(
  candidateSkills: Array<{ name: string; normalized_name?: string; source_evidence?: string; provenance_context?: string }>,
  requirementName: string
): OntologyMatchResult {
  const reqLower = requirementName.toLowerCase().trim();
  const reqNode = findOntologyNode(requirementName);

  const candNodes = candidateSkills.map(s => ({
    skill: s,
    node: findOntologyNode(s.name) || findOntologyNode(s.normalized_name || '')
  }));

  // 1. Exact Name String Match (e.g. candidate literally has "PostgreSQL Administration" or "MySQL")
  for (const item of candNodes) {
    if (item.skill.name.toLowerCase() === reqLower || (item.skill.normalized_name && item.skill.normalized_name.toLowerCase() === reqLower)) {
      return {
        isMatch: true,
        matchType: 'EXACT',
        matchScore: 1.0,
        matchedSkills: [item.skill.name],
        explanation: `Candidate demonstrates exact verified skill '${item.skill.name}'.`,
        isPartial: false
      };
    }
  }

  // 2. Specialization / Partial Match Checks (e.g. PostgreSQL vs PostgreSQL Administration / DBA)
  if (reqLower.includes('admin') || reqLower.includes('dba') || reqLower.includes('administration') || reqLower.includes('tuning')) {
    for (const item of candNodes) {
      if (item.node && (reqLower.includes(item.node.canonicalName.toLowerCase()) || reqLower.includes(item.node.id))) {
        // Check if candidate has DBA evidence keywords in source evidence or context
        const evidenceText = ((item.skill.source_evidence || '') + ' ' + (item.skill.provenance_context || '') + ' ' + item.skill.name).toLowerCase();
        const dbaKeywords = ['admin', 'dba', 'replication', 'backup', 'tuning', 'cluster', 'failover', 'optimization'];
        const hasDbaEvidence = dbaKeywords.some(k => evidenceText.includes(k));

        if (hasDbaEvidence) {
          return {
            isMatch: true,
            matchType: 'SEMANTIC',
            matchScore: 0.90,
            matchedSkills: [item.skill.name],
            explanation: `Candidate demonstrates '${item.skill.name}' with database administration evidence.`,
            isPartial: false
          };
        } else {
          return {
            isMatch: true,
            matchType: 'PARTIAL',
            matchScore: 0.55,
            matchedSkills: [item.skill.name],
            explanation: `Candidate demonstrates '${item.skill.name}', but lacks verified database administration / DBA evidence.`,
            isPartial: true,
            missingAspects: 'Database administration / DBA operational evidence'
          };
        }
      }
    }
  }

  // 3. Canonical Node Equality (e.g. JS -> JavaScript, RDBMS -> Relational Database)
  for (const item of candNodes) {
    if (reqNode && item.node && reqNode.id === item.node.id) {
      return {
        isMatch: true,
        matchType: 'CANONICAL',
        matchScore: 0.98,
        matchedSkills: [item.skill.name],
        explanation: `Candidate demonstrates canonical skill '${item.skill.name}' which matches '${requirementName}'.`,
        isPartial: false
      };
    }
  }

  // 3. Hierarchical Match: Candidate has child technologies that fulfill a parent requirement
  // Example: Candidate has MySQL and/or PostgreSQL -> Requirement: Relational Database or SQL Querying & Data Extraction
  if (reqNode) {
    // Check if candidate has direct children or deep descendants of reqNode
    const matchedChildren: string[] = [];

    for (const item of candNodes) {
      if (item.node) {
        if (reqNode.children.includes(item.node.id)) {
          matchedChildren.push(item.skill.name);
        } else if (item.node.parents.includes(reqNode.id)) {
          matchedChildren.push(item.skill.name);
        } else if (
          (reqNode.id === 'sql' || reqNode.id === 'relational_database' || reqNode.id === 'database_systems') &&
          ['mysql', 'postgresql', 'sqlite', 'oracle_database', 'sql_server', 'sql', 'database_systems', 'relational_database'].includes(item.node.id)
        ) {
          matchedChildren.push(item.skill.name);
        }
      }
    }

    if (matchedChildren.length > 0) {
      return {
        isMatch: true,
        matchType: 'HIERARCHICAL',
        matchScore: 0.95,
        matchedSkills: Array.from(new Set(matchedChildren)),
        explanation: `Candidate demonstrates ${Array.from(new Set(matchedChildren)).join(' and ')}, fulfilling the '${requirementName}' requirement.`,
        isPartial: false
      };
    }
  }

  // 4. Reverse Hierarchical: candidate has only the BROADER parent capability
  // while the requirement asks for a specific child.
  //
  // This is a PARTIAL match, never a full one. "Digital Marketing" on a resume
  // is not proof of "SEO"; "Programming Languages" is not proof of "Python".
  // Scoring it as a 0.85 full match inflated readiness by crediting evidence
  // the candidate never actually supplied.
  if (reqNode && reqNode.parents.length > 0) {
    for (const item of candNodes) {
      if (item.node && reqNode.parents.includes(item.node.id)) {
        return {
          isMatch: true,
          matchType: 'PARTIAL',
          matchScore: 0.5,
          matchedSkills: [item.skill.name],
          explanation: `Candidate demonstrates the broader capability '${item.skill.name}', but '${requirementName}' is a more specific skill that is not separately evidenced.`,
          isPartial: true,
          missingAspects: `Direct evidence of ${requirementName}`
        };
      }
    }
  }

  // 5. Incompatible / No Match Check (e.g. MySQL for MongoDB -> NO_MATCH)
  return {
    isMatch: false,
    matchType: 'NONE',
    matchScore: 0.0,
    matchedSkills: [],
    explanation: `No verified evidence for '${requirementName}' found in candidate profile.`,
    isPartial: false
  };
}
