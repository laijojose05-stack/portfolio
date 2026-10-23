/*
 * Single source of truth for project cards, project details, and certificates.
 * Edit this file to update the Projects and Certificates sections.
 *
 * Links policy: only add a GitHub or live-demo URL when the repository or site
 * is real and publicly accessible. Use null when no valid link exists.
 */

export const projects = [
  {
    id: 'mediconnect',
    title: 'MediConnect',
    category: 'Healthcare Information System',
    summary:
      'A PHP and MySQL web platform for discovering rare medicines at medical stores and finding relevant hospital departments.',
    thumbnail: '/images/project-mediconnect.png',
    thumbnailAlt: 'Screenshot of the MediConnect healthcare information system.',
    thumbnailWidth: 1920,
    thumbnailHeight: 1080,
    technologies: ['PHP', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    filters: ['php', 'mysql'],
    links: {
      github: null,
      demo: null,
    },
    details: {
      overview:
        'MediConnect is a PHP-based healthcare information platform designed to help users discover rare medicines available at medical stores and identify relevant departments in hospitals. The project aims to make healthcare-related information easier to find through a simple web interface.',
      problem:
        'Finding uncommon medicines can be difficult when information is distributed across different medical stores. Users may also need help identifying the hospital department relevant to their needs. MediConnect aims to organize relevant information in one accessible platform.',
      objectives: [
        'Make rare-medicine information easier to discover.',
        'Help users explore relevant medical store information.',
        'Organize hospital department information.',
        'Provide a user-friendly healthcare information interface.',
        'Demonstrate server-side web development and database integration.',
      ],
      features: [
        'Search and browse records for uncommon medicines listed in the application database.',
        'View medical store information alongside medicine records where it is stored.',
        'Explore hospital department information to help identify a relevant department.',
        'Database-backed records managed through a PHP and MySQL backend.',
        'A clean, responsive interface for browsing information on desktop and mobile.',
      ],
      workflow: [
        'The user opens the website.',
        'The user browses or searches the available medicine or department information.',
        'The PHP backend processes the supported requests.',
        'MySQL supplies the relevant stored records.',
        'The interface displays matching information where available.',
      ],
      technologies: [
        { name: 'PHP', purpose: 'Backend processing and application logic.' },
        { name: 'MySQL', purpose: 'Structured data storage for medicines, stores, and departments.' },
        { name: 'HTML', purpose: 'Page structure and accessible content.' },
        { name: 'CSS', purpose: 'Styling and responsive layouts.' },
        { name: 'JavaScript', purpose: 'Frontend interactions that support browsing.' },
      ],
      learnings: [
        'Building server-side application logic with PHP.',
        'Designing and querying relational data with MySQL.',
        'Organizing information so that it is easy to search and read.',
        'Connecting a frontend interface to backend data.',
      ],
      future: [
        'Verified stock updates supplied by medical stores.',
        'Improved search with clearer filters and matching.',
        'Map-based discovery of nearby medical stores and hospitals.',
        'Secure record management with appropriate access control.',
      ],
      note: 'MediConnect is an information-discovery project. It does not provide medical advice, verify live pharmacy stock, or connect to hospital systems.',
    },
  },
  {
    id: 'openlearn',
    title: 'OpenLearn',
    category: 'Learning Management System',
    summary:
      'A Flask-based learning management system that organizes educational material in one accessible web interface.',
    thumbnail: '/images/project-openlearn.svg',
    thumbnailAlt:
      'Illustration of the OpenLearn interface with a navigation sidebar, learning material cards, and a book illustration.',
    technologies: ['Python', 'Flask', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    filters: ['python', 'mysql'],
    links: {
      github: null,
      demo: null,
    },
    details: {
      overview:
        'OpenLearn is a web-based Learning Management System developed using Python Flask. It is designed to organize learning materials and support student learning activities through an accessible web interface.',
      problem:
        'Learning resources can become difficult to organize when they are distributed across different platforms or locations. OpenLearn aims to provide a more centralized and structured way to access available educational materials.',
      objectives: [
        'Organize learning-related information.',
        'Provide an accessible learning interface.',
        'Support student learning activities.',
        'Demonstrate Python Flask development.',
        'Integrate a relational database where required.',
      ],
      features: [
        'Structured learning sections for browsing available educational material.',
        'Database-backed content accessed through Flask routes.',
        'A student-facing interface designed for straightforward navigation.',
        'Clear separation between page structure, styling, and application logic.',
        'Supporting client-side interactions for a smoother browsing experience.',
      ],
      workflow: [
        'A user opens the OpenLearn website.',
        'The user navigates through the available learning sections.',
        'Flask processes the supported requests.',
        'MySQL is accessed where required.',
        'The website displays the requested educational information.',
      ],
      technologies: [
        { name: 'Python', purpose: 'Backend programming and application logic.' },
        { name: 'Flask', purpose: 'Routing and request handling.' },
        { name: 'MySQL', purpose: 'Structured data storage for learning content.' },
        { name: 'HTML and CSS', purpose: 'Interface structure and presentation.' },
        { name: 'JavaScript', purpose: 'Client-side interactions.' },
      ],
      learnings: [
        'Developing a web application with Python and Flask.',
        'Understanding routing and request handling.',
        'Connecting application routes to a relational database.',
        'Structuring a project so that it is easier to extend.',
        'Designing an educational interface with a clear hierarchy.',
      ],
      future: [
        'Course enrollment for students.',
        'Assignments and quizzes.',
        'Student dashboards.',
        'Progress tracking.',
        'Notifications for new material and deadlines.',
      ],
      note: 'Enrollment, assignments, quizzes, student dashboards, progress tracking, and notifications are future ideas, not features of the current version.',
    },
  },
  {
    id: 'seafile',
    title: 'SeaFile',
    category: 'Personal Cloud Storage',
    summary:
      'A Node.js and Supabase personal cloud storage app for uploading, organizing, and accessing files through the browser.',
    thumbnail: '/images/project-seafile.png',
    thumbnailAlt: 'Screenshot of the SeaFile cloud storage interface.',
    thumbnailWidth: 1920,
    thumbnailHeight: 1080,
    technologies: ['Node.js', 'Supabase', 'HTML', 'CSS', 'JavaScript'],
    filters: ['nodejs', 'supabase'],
    links: {
      github: null,
      demo: null,
    },
    details: {
      overview:
        'SeaFile is a personal cloud storage web application developed using Node.js and Supabase. It is designed to provide a web interface for storing, managing, and accessing files. The project explores the integration of a JavaScript backend with hosted services for file storage and database functionality.',
      problem:
        'Files can become difficult to organize and access when scattered across local folders and devices. A cloud storage interface aims to provide a more centralized way to manage files, depending on the storage configuration and permissions.',
      objectives: [
        'Build a web interface for personal file management.',
        'Explore Node.js backend development.',
        'Integrate Supabase services.',
        'Manage file information and storage operations.',
        'Demonstrate frontend, backend, and cloud-service integration.',
      ],
      features: [
        'Upload files through the web interface to configured Supabase Storage.',
        'List stored files and view the metadata kept for each file.',
        'Download and delete files that the current configuration allows a user to manage.',
        'A Node.js server that handles supported file-management requests.',
        'A Supabase database used for file metadata where configured.',
        'A responsive interface that displays file information and available actions.',
      ],
      workflow: [
        'The user opens the application.',
        'The user interacts with the file-management interface.',
        'The Node.js backend or configured Supabase client handles supported requests.',
        'Supabase Storage stores files when configured for that purpose.',
        'A Supabase database may store file metadata if used.',
        'The interface displays file information and available operations.',
      ],
      technologies: [
        { name: 'Node.js', purpose: 'Server-side JavaScript runtime for file-management requests.' },
        { name: 'Supabase', purpose: 'Hosted database and storage services, as configured.' },
        { name: 'HTML and CSS', purpose: 'The storage interface and its responsive presentation.' },
        { name: 'JavaScript', purpose: 'Client-side interactions with the file manager.' },
      ],
      learnings: [
        'Building backend features with Node.js.',
        'Integrating hosted storage and database services.',
        'Thinking through file-management workflows and error states.',
        'Understanding how access permissions affect storage operations.',
      ],
      future: [
        'Folder management.',
        'File sharing links.',
        'Search across stored files.',
        'Upload progress indicators.',
        'File previews.',
        'Storage usage indicators.',
      ],
      note: 'Storage limits, availability, and access depend on the Supabase project configuration. SeaFile does not claim unlimited storage, end-to-end encryption, or guaranteed availability.',
    },
  },
];

/*
 * Certificates: add entries in this shape when they are earned. Leave the array
 * empty until then. No certificate is shown unless it is added here.
 *
 * {
 *   title: 'Certificate title',
 *   issuer: 'Issuing organisation',
 *   date: 'Month Year',
 *   url: 'https://link-to-the-credential',
 * }
 */
export const certificates = [];
