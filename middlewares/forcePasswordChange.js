export default function forcePasswordChange(req, res, next) {
    const user = req.user;
    if (!user) return next();

    const today = new Date();

    if (user.must_change_password) {
        return res.redirect('/profile/edit?msg=change_password');
    }

    const lastChange = new Date(user.last_password_change);
    const diffMonths = (today.getFullYear() - lastChange.getFullYear()) * 12 + (today.getMonth() - lastChange.getMonth());

    if (diffMonths >= 3) {
        return res.redirect('/profile/edit?msg=update_password');
    }

    next();
}
