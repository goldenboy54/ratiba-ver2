import { getUserById, updateUserProfile, deleteUserProfile } from "../models/userProfileModel.js";

// Show profile page
export const showProfile = async (req, res) => {
    try {
        const userId = req.session.userId || (req.user && req.user.user_id);
        if (!userId) return res.redirect("/login");

        const user = await getUserById(userId);

        // chukua query param 'msg'
        const msg = req.query.msg || null;

        res.render("userProfile", { user, error: null, success: null, msg });
    } catch (err) {
        res.status(500).send("Error loading profile: " + err.message);
    }
};


// Handle profile update
export const handleProfileUpdate = async (req, res) => {
    const userId = req.session.userId || (req.user && req.user.user_id);
    if (!userId) return res.redirect("/login");

    const { full_name, department, user_email, password } = req.body;

    try {
        // If password is empty but user was forced to change password
        const user = await getUserById(userId);

        if (user.must_change_password && (!password || password.trim() === "")) {
            return res.render("userProfile", {
                user,
                error: "You must set a new password before proceeding!",
                success: null
            });
        }

        // Update profile
        await updateUserProfile(userId, { full_name, department, user_email, password });

        const updatedUser = await getUserById(userId);
        res.render("userProfile", {
            user: updatedUser,
            error: null,
            success: "Profile updated successfully!"
        });
    } catch (err) {
        const user = await getUserById(userId);
        res.render("userProfile", { user, error: "Error updating profile: " + err.message, success: null });
    }
};


// Handle profile deletion
export const handleProfileDelete = async (req, res) => {
    const userId = req.session.userId || (req.user && req.user.user_id);
    if (!userId) return res.redirect("/login");

    try {
        await deleteUserProfile(userId);
        req.session.destroy((err) => {
            if (err) console.error("Session destroy error:", err);
            res.redirect("/login");
        });
    } catch (err) {
        const user = await getUserById(userId);
        res.render("userProfile", { user, error: "Error deleting profile: " + err.message, success: null });
    }
};
