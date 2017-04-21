# Multiplication quiz

This is a small webapp that generates quizzes for multipying two 2-digit numbers. It is currently running live at [jonathan-at-knocki.tech](https://jonathan-at-knocki.tech). Taking a quiz does not require any login but there is an admin console to see previous quizzes. You can login via test@knocki.com/knocki (e-mail/password); once logged in, you can create more admin users via the link in the admin panel.

To fire up another instance of the app, you need to:

1. cp credentials-template.js to credentials.js and edit `cookieSecret` and `connectionString`.

2. If no current admins exist, make an admin user via command console by running add\_admin\_user.js:

    `node add_admin_user.js EMAIL PASSWORD`

3. run `npm install`

4. run `npm start`

The app will begin listening on port 3000.

Thank you for your consideration!

Jonathan
