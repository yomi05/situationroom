// Full permission map + nested menu that mirrors your old app

export const PERMS = {
  VIEW_DASHBOARD: 'view:dashboard',

  VIEW_FORMS: 'view:forms',
  CREATE_FORMS: 'create:forms',

  SUBMIT_INCIDENT: 'incident:submit',
  VIEW_INCIDENT_SUBMISSIONS: 'incident:submissions',

  VIEW_POLLING_FORMS: 'view:polling-forms',

  VIEW_RESOURCES: 'resources:view',
  VIEW_PAST_ELECTIONS: 'resources:past-elections:view',
  UPDATE_PAST_ELECTIONS: 'resources:past-elections:update',

  VIEW_VOTERS_REGISTRATION: 'resources:voters:view',
  UPDATE_VOTERS_REGISTRATION: 'resources:voters:update',

  VIEW_PARTIES: 'resources:parties:view',
  UPDATE_PARTIES: 'resources:parties:update',

  VIEW_POLLING_UNITS: 'resources:polling-units:view',
  UPDATE_POLLING_UNITS: 'resources:polling-units:update',

  VIEW_REPOSITORY: 'repository:view',
  MANAGE_REPOSITORY_CATEGORIES: 'repository:categories:manage',

  VIEW_CONTENT: 'content:view',

  VIEW_STATUS_CATEGORY: 'status:category:view',
  VIEW_STATUS_INFORMATION: 'status:information:view',
  MANAGE_STATUS_INFORMATION: 'status:information:manage',

  VIEW_PARTNERS: 'partners:view',
  MANAGE_PARTNERS: 'partners:manage',

  VIEW_NOTABLE_DATES: 'notable-dates:view',
  MANAGE_NOTABLE_DATES: 'notable-dates:manage',

  VIEW_USERS: 'users:view',
  VIEW_API: 'api:view'
};

export const ROLE_PERMISSIONS = {
  Admin: [
    PERMS.VIEW_DASHBOARD,
    PERMS.VIEW_FORMS, PERMS.CREATE_FORMS,
    PERMS.SUBMIT_INCIDENT, PERMS.VIEW_INCIDENT_SUBMISSIONS,
    PERMS.VIEW_POLLING_FORMS,
    PERMS.VIEW_RESOURCES, PERMS.VIEW_PAST_ELECTIONS, PERMS.UPDATE_PAST_ELECTIONS,
    PERMS.VIEW_VOTERS_REGISTRATION, PERMS.UPDATE_VOTERS_REGISTRATION,
    PERMS.VIEW_PARTIES, PERMS.UPDATE_PARTIES,
    PERMS.VIEW_POLLING_UNITS, PERMS.UPDATE_POLLING_UNITS,
    PERMS.VIEW_REPOSITORY, PERMS.MANAGE_REPOSITORY_CATEGORIES,
    PERMS.VIEW_CONTENT,
    PERMS.VIEW_STATUS_CATEGORY, PERMS.VIEW_STATUS_INFORMATION, PERMS.MANAGE_STATUS_INFORMATION,
    PERMS.VIEW_PARTNERS, PERMS.MANAGE_PARTNERS,
    PERMS.VIEW_NOTABLE_DATES, PERMS.MANAGE_NOTABLE_DATES,
    PERMS.VIEW_USERS, PERMS.VIEW_API
  ],
  WebAdmin: [
    PERMS.VIEW_DASHBOARD,
    PERMS.VIEW_FORMS, PERMS.CREATE_FORMS,
    PERMS.SUBMIT_INCIDENT, PERMS.VIEW_INCIDENT_SUBMISSIONS,
    PERMS.VIEW_POLLING_FORMS,
    PERMS.VIEW_RESOURCES, PERMS.VIEW_PAST_ELECTIONS, PERMS.UPDATE_PAST_ELECTIONS,
    PERMS.VIEW_VOTERS_REGISTRATION, PERMS.UPDATE_VOTERS_REGISTRATION,
    PERMS.VIEW_PARTIES, PERMS.UPDATE_PARTIES,
    PERMS.VIEW_POLLING_UNITS, PERMS.UPDATE_POLLING_UNITS,
    PERMS.VIEW_REPOSITORY, PERMS.MANAGE_REPOSITORY_CATEGORIES,
    PERMS.VIEW_CONTENT,
    PERMS.VIEW_STATUS_CATEGORY, PERMS.VIEW_STATUS_INFORMATION, PERMS.MANAGE_STATUS_INFORMATION,
    PERMS.VIEW_PARTNERS, PERMS.MANAGE_PARTNERS,
    PERMS.VIEW_NOTABLE_DATES, PERMS.MANAGE_NOTABLE_DATES,
    PERMS.VIEW_API
  ],
  Staff: [
    PERMS.VIEW_DASHBOARD,
    PERMS.VIEW_FORMS, PERMS.CREATE_FORMS,
    PERMS.SUBMIT_INCIDENT, PERMS.VIEW_INCIDENT_SUBMISSIONS,
    PERMS.VIEW_POLLING_FORMS,
    PERMS.VIEW_RESOURCES, PERMS.VIEW_PAST_ELECTIONS, PERMS.UPDATE_PAST_ELECTIONS,
    PERMS.VIEW_VOTERS_REGISTRATION, PERMS.UPDATE_VOTERS_REGISTRATION,
    PERMS.VIEW_PARTIES, PERMS.UPDATE_PARTIES,
    PERMS.VIEW_POLLING_UNITS, PERMS.UPDATE_POLLING_UNITS,
    PERMS.VIEW_REPOSITORY, PERMS.MANAGE_REPOSITORY_CATEGORIES,
    PERMS.VIEW_CONTENT,
    PERMS.VIEW_STATUS_CATEGORY, PERMS.VIEW_STATUS_INFORMATION, PERMS.MANAGE_STATUS_INFORMATION,
    PERMS.VIEW_PARTNERS, PERMS.MANAGE_PARTNERS,
    PERMS.VIEW_NOTABLE_DATES, PERMS.MANAGE_NOTABLE_DATES,
    PERMS.VIEW_API
  ],
  Observers: [
    PERMS.VIEW_DASHBOARD,
    PERMS.SUBMIT_INCIDENT,
    PERMS.VIEW_POLLING_FORMS,
    PERMS.VIEW_RESOURCES, PERMS.VIEW_PAST_ELECTIONS,
    PERMS.VIEW_VOTERS_REGISTRATION,
    PERMS.VIEW_PARTIES,
    PERMS.VIEW_POLLING_UNITS,
    PERMS.VIEW_REPOSITORY,
    PERMS.VIEW_CONTENT,
    PERMS.VIEW_STATUS_CATEGORY, PERMS.VIEW_STATUS_INFORMATION,
    PERMS.VIEW_PARTNERS,
    PERMS.VIEW_NOTABLE_DATES
  ],
  Reporters: [
    PERMS.VIEW_DASHBOARD,
    PERMS.SUBMIT_INCIDENT,
    PERMS.VIEW_POLLING_FORMS,
    PERMS.VIEW_RESOURCES, PERMS.VIEW_PAST_ELECTIONS,
    PERMS.VIEW_VOTERS_REGISTRATION,
    PERMS.VIEW_PARTIES,
    PERMS.VIEW_POLLING_UNITS,
    PERMS.VIEW_REPOSITORY,
    PERMS.VIEW_CONTENT,
    PERMS.VIEW_STATUS_CATEGORY, PERMS.VIEW_STATUS_INFORMATION,
    PERMS.VIEW_PARTNERS,
    PERMS.VIEW_NOTABLE_DATES
  ],
  Guest: [PERMS.VIEW_DASHBOARD]
};

export function hasPerm(role = 'Guest', perm) {
  const list = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Guest;
  return list.includes(perm);
}

const MENU = [
  { label: 'Overview', href: '/dashboard', icon: '🏠', perm: PERMS.VIEW_DASHBOARD },

  {
    label: 'Forms', icon: '🧾', children: [
      { label: 'All Forms', href: '/dashboard/forms', perm: PERMS.VIEW_FORMS },
      { label: 'Create Form', href: '/dashboard/forms/create', perm: PERMS.CREATE_FORMS },
    ]
  },

  {
    label: 'Incidents', icon: '🚨', children: [
      { label: 'Submit Incident', href: '/dashboard/incident-report', perm: PERMS.SUBMIT_INCIDENT },
      { label: 'Submissions', href: '/dashboard/incident-report/submissions', perm: PERMS.VIEW_INCIDENT_SUBMISSIONS },
    ]
  },

  { label: 'Polling Forms', href: '/dashboard/polling-forms', icon: '🗳️', perm: PERMS.VIEW_POLLING_FORMS },

  {
    label: 'Resources', icon: '📚', perm: PERMS.VIEW_RESOURCES, children: [
      {
        label: 'Past Elections', children: [
          { label: 'Presidential', href: '/dashboard/resources/past-elections/presidential', perm: PERMS.VIEW_PAST_ELECTIONS },
          { label: 'Governorship', href: '/dashboard/resources/past-elections/governorship', perm: PERMS.VIEW_PAST_ELECTIONS },
          { label: 'Senatorial', href: '/dashboard/resources/past-elections/senatorial', perm: PERMS.VIEW_PAST_ELECTIONS },
          { label: 'House of Reps', href: '/dashboard/resources/past-elections/hor', perm: PERMS.VIEW_PAST_ELECTIONS },
        ]
      },
      {
        label: 'Update Election', children: [
          { label: 'Presidential', href: '/dashboard/resources/update-election/presidential', perm: PERMS.UPDATE_PAST_ELECTIONS },
          { label: 'HoR', href: '/dashboard/resources/update-election/hor', perm: PERMS.UPDATE_PAST_ELECTIONS },
          { label: 'State', href: '/dashboard/resources/update-election/state', perm: PERMS.UPDATE_PAST_ELECTIONS },
          { label: 'Senatorial', href: '/dashboard/resources/update-election/senatorial', perm: PERMS.UPDATE_PAST_ELECTIONS },
        ]
      },
      { label: 'Voters Registration', href: '/dashboard/resources/voters-registration', perm: PERMS.VIEW_VOTERS_REGISTRATION },
      { label: 'Update Registration', href: '/dashboard/resources/voters-registration/update', perm: PERMS.UPDATE_VOTERS_REGISTRATION },
      { label: 'Parties', href: '/dashboard/resources/parties', perm: PERMS.VIEW_PARTIES },
      { label: 'Polling Units', href: '/dashboard/resources/polling-units', perm: PERMS.VIEW_POLLING_UNITS },
      { label: 'Update Polling Units', href: '/dashboard/resources/polling-units/update', perm: PERMS.UPDATE_POLLING_UNITS },
    ]
  },

  {
    label: 'Election Repository', icon: '🗂️', children: [
      { label: 'Categories', href: '/dashboard/repository/categories', perm: PERMS.MANAGE_REPOSITORY_CATEGORIES },
      { label: 'Repository', href: '/dashboard/repository', perm: PERMS.VIEW_REPOSITORY },
      { label: 'View Repository', href: '/dashboard/repository/view', perm: PERMS.VIEW_REPOSITORY },
    ]
  },

  { label: 'Content', href: '/dashboard/content', icon: '📰', perm: PERMS.VIEW_CONTENT },

  {
    label: 'Status', icon: '📌', children: [
      { label: 'Category', href: '/dashboard/status/category', perm: PERMS.VIEW_STATUS_CATEGORY },
      { label: 'Information', href: '/dashboard/status/information', perm: PERMS.VIEW_STATUS_INFORMATION },
      { label: 'Manage Information', href: '/dashboard/status/information/manage', perm: PERMS.MANAGE_STATUS_INFORMATION },
    ]
  },

  {
    label: 'Partners', icon: '🤝', children: [
      { label: 'Partners', href: '/dashboard/partners', perm: PERMS.VIEW_PARTNERS },
      { label: 'Manage Partners', href: '/dashboard/partners/manage', perm: PERMS.MANAGE_PARTNERS },
    ]
  },

  {
    label: 'Notable Dates', icon: '📅', children: [
      { label: 'All Dates', href: '/dashboard/notable-dates', perm: PERMS.VIEW_NOTABLE_DATES },
      { label: 'Manage Dates', href: '/dashboard/notable-dates/manage', perm: PERMS.MANAGE_NOTABLE_DATES },
    ]
  },

  { label: 'Users', href: '/dashboard/users', icon: '👥', perm: PERMS.VIEW_USERS },
  { label: 'API', href: '/dashboard/api', icon: '⚙️', perm: PERMS.VIEW_API },
  { label: 'Profile', href: '/dashboard/profile', icon: '👤', perm: PERMS.VIEW_DASHBOARD },
];

function filter(items, role) {
  return items
    .filter(it => !it.perm || hasPerm(role, it.perm))
    .map(it => it.children ? ({ ...it, children: filter(it.children, role) }) : it)
    .filter(it => !it.children || it.children.length > 0);
}

export function getMenuForRole(role = 'Guest') {
  return filter(MENU, role);
}
