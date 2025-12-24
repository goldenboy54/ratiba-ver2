import { addSelfRegisteredUser, getUserByEmailSelf } from "../models/selfRegisterModel.js";
import { getAlldepartments } from "../models/departmentsModel.js";

export const showSelfRegisterForm = async (req, res) => {
    try {
        const departments = await getAlldepartments();
        res.render("selfRegister", { departments, error: null, success: null });
    } catch (error) {
        res.status(500).send("Error loading form: " + error.message);
    }
};

export const handleSelfRegister = async (req, res) => {
    const { full_name, department, user_email, password } = req.body;

    try {
        // Check if email exists
        const existingUser = await getUserByEmailSelf(user_email);
        if (existingUser) {
            const departments = await getAlldepartments();
            return res.render("selfRegister", { departments, error: "Email already registered!", success: null });
        }

        // Save user with status 'inactive'
        await addSelfRegisteredUser({
            full_name,
            department,
            user_email,
            password,
            role: "tutor", // Default role
            status: "inactive"
        });

        const departments = await getAlldepartments();
        res.render("selfRegister", { departments, error: null, success: "Account created successfully! Wait for admin approval." });

    } catch (error) {
        const departments = await getAlldepartments();
        res.render("selfRegister", { departments, error: "Error registering: " + error.message, success: null });
    }
};
