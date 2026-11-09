# Dashboard feature context

`/[locale]/dashboards` is the authenticated landing page and always appears in
the sidebar. It does not require a module permission or a `role.navbar` entry.
The current page greets the signed-in user using their profile and localizes
the greeting. Event and calendar links/widgets from the template were removed
because those routes are not part of Family App.
