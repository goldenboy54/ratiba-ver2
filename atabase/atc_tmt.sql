-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 24, 2024 at 03:48 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `atc_tmt`
--

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `department_code` varchar(255) DEFAULT NULL,
  `hod_name` varchar(255) DEFAULT NULL,
  `hod_email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`, `department_code`, `hod_name`, `hod_email`) VALUES
(1, 'MECHANICAL', 'mech 11', 'MTAALAM', 'mtaalam@atc.ac.tz'),
(2, 'ICT', 'ict 11', 'KAAYA', 'mwala@atc.ac.tz'),
(4, 'DASS', 'dass 11', 'AMANI MTAALAM', 'amani@atc.ac.tz'),
(5, 'ELECTRICAL', 'Eelect 11', 'Erick mtaalam', 'eric@atc.ac.tz'),
(6, 'VETD', 'vtd 121', 'SEBA', 'seba@atc.ac.tz'),
(9, 'CIVIL', 'CIVIL', 'Dr UPENDO', 'upendo@atc.ac.tz'),
(10, 'H-WAY', 'H-WAY', 'Mr CHUWA', 'chuwa@atc.ac.tz'),
(11, 'AUTOMOTIVE', 'AUTOMOTIVE', 'ENG DAVID MTUNGUJA', 'Amtunguja@atc.ac.tz');

-- --------------------------------------------------------

--
-- Table structure for table `extracted_timetables`
--

CREATE TABLE `extracted_timetables` (
  `id` int(11) NOT NULL,
  `day` varchar(20) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `subject_code` varchar(255) DEFAULT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `venue_name` varchar(255) DEFAULT NULL,
  `tutor_name` varchar(255) DEFAULT NULL,
  `venue_location` varchar(255) DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `program_name` varchar(255) DEFAULT NULL,
  `subject_credit` int(11) DEFAULT NULL,
  `program_level` varchar(255) DEFAULT NULL,
  `venue_type` varchar(255) DEFAULT NULL,
  `venue_status` varchar(255) DEFAULT NULL,
  `year` varchar(255) DEFAULT NULL,
  `total_hours_per_week` int(11) DEFAULT 0,
  `program_type` varchar(255) DEFAULT NULL,
  `venue_id` int(11) NOT NULL,
  `semester` varchar(255) NOT NULL,
  `venue_capacity` int(11) NOT NULL,
  `program_capacity` int(11) NOT NULL,
  `arrange` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `extracted_timetables`
--

INSERT INTO `extracted_timetables` (`id`, `day`, `start_time`, `end_time`, `subject_code`, `subject_name`, `venue_name`, `tutor_name`, `venue_location`, `department_name`, `program_name`, `subject_credit`, `program_level`, `venue_type`, `venue_status`, `year`, `total_hours_per_week`, `program_type`, `venue_id`, `semester`, `venue_capacity`, `program_capacity`, `arrange`) VALUES
(1, 'MONDAY', '07:30:00', '08:15:00', 'CHU 08111', 'Design software Practices', 'ALGO LAB', 'Baraka', 'ATC', 'CIVIL', 'Computer science', 6, '7-1', 'Lab', 'Available', '3', 2, 'full-time', 11, 'I', 20, 120, 1),
(2, 'MONDAY', '07:30:00', '08:15:00', 'CHU 08111', 'Design software Practices', 'Comp R22/23', 'Baraka', 'ATC', 'CIVIL', 'cybersecurity and digital forensic', 6, '4', 'Lab', 'Available', '3', 3, 'full-time', 14, 'I', 100, 50, 1),
(3, 'MONDAY', '08:20:00', '09:05:00', 'CHU 08111', 'Design software Practices', 'ALGO LAB', 'Baraka', 'ATC', 'CIVIL', 'Computer science', 6, '7-1', 'Lab', 'Available', '3', 2, 'full-time', 11, 'I', 20, 120, 1),
(4, 'MONDAY', '07:30:00', '08:15:00', 'CHU 08107', 'Solid Waste Management', 'F-06/07', 'Moshi, F', 'ATC-Irrigation', 'CIVIL', 'cybersecurity and digital forensic', 4, '4', 'Theory', 'Available', '3', 3, 'full-time', 21, 'I', 60, 50, 1),
(5, 'MONDAY', '14:25:00', '15:10:00', 'CHU 08111', 'Design software Practices', 'LAB 3', 'Baraka', 'ATC', 'CIVIL', 'cybersecurity and digital forensic', 6, '6', 'Lab', 'Available', '3', 3, 'evening', 27, 'I', 18, 50, 1),
(6, 'MONDAY', '07:30:00', '08:15:00', 'CHU 08111', 'Design software Practices', 'W/S E1', 'Baraka', 'ATC', 'CIVIL', 'Computer science', 6, '7-1', 'Lab', 'Available', '3', 2, 'full-time', 74, 'I', 20, 120, 1);

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `program_id` int(11) NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `program_code` varchar(255) NOT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `level` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `program_capacity` int(11) NOT NULL,
  `program_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `program_name`, `program_code`, `duration`, `level`, `category`, `program_capacity`, `program_type`) VALUES
(5, 'Computer science', 'L7-1CS', '3', '7-1', 'ICT', 120, 'full-time'),
(6, 'Computer science', 'L6CS', '3', '6', 'ICT', 100, 'full-time'),
(7, 'cybersecurity and digital forensic', 'L4CDF', '3', '4', 'ICT', 50, 'full-time'),
(8, 'Computer science', 'L4CS', '3', '4', 'ICT', 100, 'full-time'),
(9, 'Computer science', 'L5CS', '3', '5', 'ICT', 100, 'full-time'),
(10, 'Computer science', 'L7-2CS', '3', '7-2', 'ICT', 120, 'full-time'),
(11, 'Computer science', 'L8CS', '3', '8', 'ICT', 120, 'full-time'),
(12, 'Computer science', 'L7-2CS-E', '3', '7-2', 'ICT', 50, 'evening'),
(13, 'Computer science', 'L7-1CS-E', '3', '7-1', 'ICT', 50, 'evening'),
(14, 'Computer science', 'L8CS-E', '3', '8', 'ICT', 50, 'evening'),
(15, 'Information Technology', 'L4IT', '3', '4', 'ICT', 100, 'full-time'),
(16, 'Information Technology', 'L5IT', '3', '5', 'ICT', 100, 'full-time'),
(17, 'Information Technology', 'L6IT', '3', '6', 'ICT', 100, 'full-time'),
(18, 'Information Technology', 'L7-1IT', '3', '7-1', 'ICT', 120, 'full-time'),
(19, 'Information Technology', 'L7-2IT', '3', '7-2', 'ICT', 120, 'full-time'),
(20, 'Information Technology', 'L8IT', '3', '8', 'ICT', 120, 'full-time'),
(21, 'Information Technology', 'L7-1IT-E', '3', '7-1', 'ICT', 50, 'evening'),
(22, 'Information Technology', 'L7-2IT-E', '3', '7-2', 'ICT', 50, 'evening'),
(23, 'Information Technology', 'L8IT-E', '3', '8', 'ICT', 50, 'evening'),
(24, 'cybersecurity and digital forensic', 'L5CDF-E', '3', '5', 'ICT', 50, 'full-time'),
(25, 'cybersecurity and digital forensic', 'L6CDF', '3', '6', 'ICT', 50, 'full-time'),
(26, 'cybersecurity and digital forensic', 'L5CDF', '3', '5', 'ICT', 50, 'full-time'),
(27, 'cybersecurity and digital forensic', 'L6CDF-E', '3', '6', 'ICT', 50, 'evening'),
(28, 'Multimedia and Animation Technology. ', 'L4MAT', '3', '4', 'ICT', 50, 'full-time'),
(29, 'Multimedia and Animation Technology.', 'L5MAT', '3', '5', 'ICT', 50, 'full-time'),
(30, 'Multimedia and Animation Technology.', 'L6MAT', '3', '6', 'ICT', 50, 'full-time');

-- --------------------------------------------------------

--
-- Table structure for table `registered_subjects`
--

CREATE TABLE `registered_subjects` (
  `registered_subject_id` int(11) NOT NULL,
  `registered_subject_name` varchar(255) DEFAULT NULL,
  `registered_subject_code` varchar(255) DEFAULT NULL,
  `credit` varchar(255) DEFAULT NULL,
  `total_hours_per_week` varchar(255) DEFAULT NULL,
  `registered_subject_department` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registered_subjects`
--

INSERT INTO `registered_subjects` (`registered_subject_id`, `registered_subject_name`, `registered_subject_code`, `credit`, `total_hours_per_week`, `registered_subject_department`) VALUES
(3, 'PROGRAMMING IN C', 'CSU 07111', '9', 'LTPA(1+0+3+2)', 'ICT'),
(4, 'FRONT-END WEB DEVELOPMENT', 'ITU 07113', '9', 'LTPA(2+0+3+1)', 'ICT'),
(5, 'DIGITAL ELECTRONICS ', 'CSU 07115', '6', 'LTPA(1+0+2+1)', 'ICT'),
(6, 'COMPUTER NETWORK DESIGN', 'ITU 07114', '9', 'LTPA(2+0+3+1)', 'ICT'),
(7, 'DATABASE SYSTEMS', 'CSU 07112', '9', 'LTPA(1+0+3+2)', 'ICT'),
(8, 'APPLIED MATHEMATICS', 'GSU 07112', '6', 'LTPA(2+1+0+1)', 'DASS'),
(9, 'ENTREPRENEURSHIP', 'GSU 07114', '6', 'LTPA(2+0+0+2)', 'DASS'),
(10, 'TECHICAL COMMUNICATION SKILLS', 'GSU 07113', '6', 'LTPA(2+0+0+2)', 'DASS'),
(11, 'DATA STRUCTURE AND ALGORITHMS', 'CSU 07211', '9', 'LTPA(2+0+3+1)', 'ICT'),
(12, 'BACK-END WEB DEVELOPMENT', 'ITU 07212', '9', 'LTPA(2+0+3+1)', 'ICT'),
(13, 'OPERATING SYSTEMS', 'CSU 07214', '6', 'LTPA(2+0+0+2)', 'ICT'),
(14, 'PROPABILITY AND STATISTICS', 'GSU O7212', '6', 'LTPA(2+1+0+1)', 'DASS'),
(15, 'PYTHON PROGRAMMING', 'CSU 07217', '9', 'LTPA(2+0+3+1)', 'ICT'),
(16, 'COMPUTER SECURITY', 'ITU 07215', '6', 'LTPA(1+0+2+1)', 'ICT'),
(17, 'MULTIMEDIA', 'ITU 07219', '6', 'LTPA(1+0+2+1)', 'ICT'),
(18, 'INDUSTRIAL PRACTICAL TRAINING', 'CSU 07216', '10', '', 'ICT'),
(19, 'OOP USING JAVA', 'CSU 07311', '9', 'LTPA(2+0+3+1)', 'ICT'),
(20, 'ENCRYPTION TECHNOLOGY', 'CSU 07312', '6', 'LTPA(1+0+2+1)', 'ICT'),
(21, 'COMMUNICATION NETWORKS', 'CSU 07314', '9', 'LTPA(2+0+3+1)', 'ICT'),
(22, 'COMPUTER ARCHITECTURE', 'CSU 07315', '6', 'LTPA(2+0+0+2)', 'ICT'),
(23, 'SOFTWARE ENGINEERING', 'CSU 07316', '9', 'LTPA(2+0+2+2)', 'ICT'),
(24, 'INTELLIGENT SYSTEMS', 'CSU 07318', '9', 'LTPA(2+0+3+1)', 'ICT'),
(25, 'DEFFERENTIAL EQUATIONS', 'GSU 07312', '6', 'LTPA(2+1+0+1)', 'DASS'),
(26, 'DATABASE MANAGEMENT', 'CSU 07319', '6', 'LTPA(1+0+2+1)', 'ICT'),
(27, 'MOBILE APPLICATIONS DEVELOPMENTS', 'CSU 07411', '9', 'LTPA(2+0+3+1)', 'ICT'),
(28, 'HUMAN COMPUTER INTERACTIONS', 'CSU 07412', '6', 'LTPA(1+0+2+1)', 'ICT'),
(29, '3D-MODELLING', 'CSU 07413', '6', 'LTPA(1+0+2+1)', 'ICT'),
(30, 'MACHINE LEARNING', 'CSU 07417', '9', 'LTPA(2+0+3+1)', 'ICT'),
(31, 'BLOCKCHAIN DEVELOPMENT', 'CSU 7418', '9', 'LTPA(2+0+3+1)', 'ICT'),
(32, 'LEGAL ISSUES IN ICT', 'ITU 07415', '6', 'LTPA(2+1+0+1)', 'ICT'),
(33, 'RESEARCH METHODOLOGY', 'ITU 07414', '6', 'LTPA(2+1+0+1)', 'ICT'),
(34, 'INDUSTRIAL PRACTICAL TRAINING', 'CSU 07419', '10', '', 'ICT'),
(35, 'CLOUD COMPUTING', 'CSU 08111', '6', 'LTPA(1+1+2+0)', 'ICT'),
(36, 'INTERNET OF THINGS', 'CSU 08114', '12', 'LTPA(2+1+3+2)', 'ICT'),
(37, 'DATA ANALYTICS', 'CSU 08115', '12', 'LTPA(2+1+3+2)', 'ICT'),
(38, 'WIRELESS TECHNOLOGY', 'CSU 08112', '9', 'LTPA(2+0+3+1)', 'ICT'),
(39, 'ETHICAL HACKING', 'ITU 08111', '99', 'LTPA(2+0+3+1)', 'ICT'),
(40, 'PROJECT DESIGN', 'CSU 08116', '12', 'LTPA(2+0+0+8)', 'ICT'),
(41, 'MOBILE SECURITY', 'ITU 08211', '9', 'LTPA(2+0+2+2)', 'ICT'),
(42, 'INFORMATION SYSTEM SECURITY', 'CSU 08212', '12', 'LTPA(2+0+4+2)', 'ICT'),
(43, 'SYSTEM ADMINISTRATION', 'ITU 08215', '12', 'LTPA(2+0+4+2)', 'ICT'),
(44, 'NETWORK MANAGEMENT AND ADMINISTRATION', 'CSU 08213', '12', 'LTPA(2+1+4+1)', 'ICT'),
(45, 'PROJECT IMPLEMENTATION', 'CSU 08216', '15', 'LTPA(2+0+0+8)', 'ICT'),
(46, 'BUSINESS COMMUNICATION SKILLS', 'GST 05108', '6', 'LTPA(2+0+0+1)', 'DASS'),
(47, 'COMPUTER NETWORK DESIGN AND ADMINISTRATION ', 'ITT 05101', '12', 'LTPA(3+1+3+1)', 'ICT'),
(48, 'COMPUTER ARCHITECTURE', 'CST 05102', '9', 'LTPA(3+1+1+1)', 'ICT'),
(49, 'BASIC OF DIFFERENTIATION AND INTERGRATION', 'GST 05105', '6', 'LTPA(2+1+0+1)', 'DASS'),
(50, 'DATABASE MANAGEMENT AND IMPLEMENTATION', 'ITT 05105', '12', 'LTPA(3+1+3+1)', 'ICT'),
(51, 'OBJECT-ORIENTED PROGRAMMING USING C++', 'CST 05105', '9', 'LTPA(2+1+2+1)', 'ICT'),
(52, 'WEB PROGRAMMING ', 'CST  05201', '12', 'LTPA(3+1+3+1)', 'ICT'),
(53, 'FUNDAMENTAL OF LINUX ADMINISTRATION', 'ITT 05202', '6', 'LTPA(2+0+1+1)', 'ICT'),
(54, 'OBJECT-ORIENTED PROGRAMMING USING JAVA', 'CST 05203', '9', 'LTPA(2+1+2+1)', 'ICT'),
(55, 'COMPUTER MAINTENANCE AND REPAIR', 'ITT 05204', '9', 'LTPA(2+1+2+1)', 'ICT'),
(56, 'OPERATING SYSTEMS', 'CST 05205', '9', 'LTPA(3+1+1+1)', 'ICT'),
(57, 'PROGRAMMING FOR MOBILE DEVICES', 'CST 05206', '6', 'LTPA(2+0+1+1)', 'ICT'),
(58, 'MULTIMEDIA TECHNOLOGY', 'ITT 05103', '6', 'LTPA(2+0+1+1)', 'ICT'),
(59, 'BASICS OF ENTREPRENEURSHIP', 'GST 05203', '6', 'LTPA(2+1+0+1)', 'ICT'),
(60, 'INDUSTRIAL PRACTICAL TRAINING (IPT)', 'ITT 05207', '10', '', 'ICT'),
(61, 'DISCRETE MATHEMATICS', 'GST 06106', '9', 'LTPA(3+2+0+1)', 'DASS'),
(62, 'SOFTWARE DESIGN & DEVELOPMENT', 'CST 06101', '10', 'LTPA(3+2+1+0)', 'ICT'),
(63, 'CYBER SECURITY', 'ITT 06102', '12', 'LTPA(3+2+2+1)', 'ICT'),
(64, 'PYTHON PROGRAMMING', 'CST 06102', '12', 'LTPA(3+2+3+0)', 'ICT'),
(65, 'INFORMATION SYSTEM PROJECT MANAGEMENT', 'ITT 06105', '12', 'LTPA(3+1+1+1)', 'ICT'),
(66, 'FINAL YEAR PROJECT - I', 'CST 06103', '12', 'LTPA(0+0+4+0)', 'ICT'),
(67, 'SUPERVISORY COMMUNICATION SKILLS', 'GST 06203', '6', 'LTPA(3+1+0+0)', 'DASS'),
(68, 'ADVANCED NETWORK MANAGEMENT', 'ITT 06204', '12', 'LTPA(3+2+3+0)', 'ICT'),
(69, 'FUNDAMENTALS OF DATA STRUCTURE AND ALGORITHMS', 'CSD 06203', '10', 'LTPA(3+1+2+0)', 'ICT'),
(70, 'MICROPROCESSOR TECHNOLOGY', 'CST 06205', '10', 'LTPA(3+1+2+0)', 'ICT'),
(71, 'PRINCIPAL OF MANAGEMENT', 'ITT 06201', '9', 'LTPA(3+2+0+1)', 'ICT'),
(72, 'FINAL YEAR PROJECT - II', 'CST 06204', '12', 'LTPA(0+0+4+0)', 'ICT'),
(73, 'SYSTEM ANALYSIS AND DESIGN AND DESIGN ', 'ITT 06101', '12', 'LTPA(3+1+3+1)', 'ICT'),
(75, 'SYSTEM ADMINISTRATION', 'ITT 06104', '12', 'LTPA(3+1+3+1)', 'ICT'),
(76, 'WIRELESS NETWORKING', 'ITT 06202', '12', 'LTPA(3+1+3+1)', 'ICT'),
(77, 'BASIC OF ELECTRONICS', 'CST 04101', '12', 'LTPA(3+1+3+1)', 'ICT'),
(78, 'BASIC OF COMPUTER NETWORKS', 'CST 04102', '12', 'LTPA(3+1+3+1)', 'ICT'),
(79, 'COMPUTER FUNDAMENTALS AND APPLICATIONS', 'ITT 04101', '12', 'LTPA(3+1+3+1)', 'ICT'),
(80, 'INTERNET ESSENTIALS', 'ITT 04102', '9', 'LTPA(2+1+2+1)', 'ICT'),
(81, 'ENGLISH LANGUAGE BASICS', 'GST 04103', '6', 'LTPA(2+1+0+1)', 'DASS'),
(82, 'ELEMENTARY MATHEMATICS', 'GST 04111', '6', 'LTPA(2+1+0+1)', 'DASS'),
(83, 'PROGRAMMING USING C', 'CST  04201', '12', 'LTPA(3+1+3+1)', 'ICT'),
(84, 'BASICS OF MULTIMEDIA', 'CST 04202', '12', 'LTPA(3+1+3+1)', 'ICT'),
(85, 'COMPUTER MAINTENANCE AND TROUBLESHOOTING', 'ITT 04201', '12', 'LTPA(3+1+3+1)', 'ICT'),
(86, 'WEB DESIGN', 'ITT 04202', '12', 'LTPA(3+1+3+1)', 'ICT'),
(87, 'MATRICES,STATISTICS AND COMPLEX NUMBERS', 'GST 04204', '6', 'LTPA(2+1+0+1)', 'DASS'),
(88, 'GENDER AND HIV', 'GST 04202', '5', 'LTPA(2+1+0+1)', 'DASS'),
(89, 'INDUSTRIAL PRACTICAL TRAINING (IPT)', 'CST 04205', '10', 'LTPA(0+0+7+0)', 'ICT'),
(90, 'Algebra and Trigonometry ', 'GST 04101', '5', 'LTP(2+1+0)', 'DASS'),
(97, 'Mechanics And Nuclear Physics', 'GST 04102/GST 04112', '6', 'LTP(2+2+0)', 'ELECTRICAL'),
(98, 'Basic Computer Application ', 'ITT 04117', '6', ' LTP (2+0+2)', 'ICT'),
(99, 'Analogue Electronics', 'ETT 04101', '12', 'LTP(3+1+4)', 'ELECTRICAL'),
(100, 'Basic Electricity/ Basic Electrical Engineering/ Electrical Circuit Troubleshooting ', 'EHT 04113/EET 04101/IET 04114', '9', 'LTP(3+2+0)', 'ELECTRICAL'),
(101, 'Domestic Installation And Mechanical Skills/ Basics of Workshop Technology and Practices/ Electrical Installation ', 'EET 04102/EST 04102/EHT O4111/IET 04115', '12', 'LTP(0+0+8)', 'ELECTRICAL'),
(102, 'Electrical Measurement I / Solar Electrical Measurements', 'EET 04104/EST 04103/IET 04115', '9', 'LTP(2+0+4)', 'ELECTRICAL'),
(103, 'Printed Circuit Board And Draughting Technique', 'EET 04103', '12', 'LTP(2+0+6)', 'ELECTRICAL'),
(104, 'Workshop Technology ', 'EHT 04112', '9', 'LTP(2+0+4)', 'ELECTRICAL'),
(105, 'Basics Electronics', 'EHT 04114', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(106, 'Basics of Hydropower Engineering', 'EHT 04115', '9', 'LTP (3+2+0)', 'ELECTRICAL'),
(107, 'Energy and Climate Change ', 'RET 04101', '6', 'LTP (3+0+0)', 'ELECTRICAL'),
(108, 'Occupational Health and Safety', 'IET 04111', '9', 'LTP (3+2+0)', 'ELECTRICAL'),
(109, 'Technical Drawing', 'IET 04112', '6', 'LTP (0+0+4)', 'ELECTRICAL'),
(110, 'Analogue Electronics Device and Circuit ', 'ETT 05101/IET05114', '12', 'LTP(3+1+4)', 'ELECTRICAL'),
(111, 'Introduction To Programming Using C', 'GST 05103/GST 05113', '6', 'LTP(2+0+2)', 'ICT'),
(112, 'Computer Aided Design/ Electronics Circuit software and Power supply', 'ETT 05102', '6', 'LTP (1+0+3)', 'ELECTRICAL'),
(113, 'Control Engineering/ Basic Control Engineering', 'EET 05104/ EHT 05104', '4', 'LTP (2+1+1)', 'ELECTRICAL'),
(114, 'Electromagnetism', 'EET 05103', '4', 'LTP (2+0+1)', 'ELECTRICAL'),
(115, 'Differentiation and Integration', 'GST 05101/GST 05111', '6', 'LTP (2+2+0)', 'DASS'),
(116, 'Thermal Energy, Wave and Organic Compounds', 'GST 05102', '6', 'LTP (2+1+0)', 'ELECTRICAL'),
(117, 'DC Machines', 'EET 05101/EHT 05111/IET 05115', '9', 'LTP (2+1+2)', 'ELECTRICAL'),
(118, 'Workshop Practice 1', 'EET 05102', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(119, 'Antenna and Transmission Lines', 'ETT 05104', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(120, 'Television Technology', 'ETT 05103', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(121, 'Solar Power Plant Engineering', 'EST 05105', '12', 'LTP (3+3+1)', 'ELECTRICAL'),
(122, 'Fundamental of  Turning, Milling and Welding Technology ', 'MET 05108', '9', 'LTP (1+0+4)', 'MECHANICAL'),
(123, 'Wind energy resources ', 'WET 05101', '6', 'LTP (2+1+0)', 'ELECTRICAL'),
(124, 'Wind Energy System ', 'WET 05102', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(125, 'Renewable Energy Technology', 'RET 05101', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(126, 'Power Electronics', 'EHT 05112', '9', 'LTP (4+0+2)', 'ELECTRICAL'),
(127, 'Welding and Metal Fabrication', 'EHT 05113', '9', 'LTP (0+0+6)', 'ELECTRICAL'),
(128, 'Electrical Machines Installation/Electrical Machines Installation and Maintenance', 'EHT 05114/IET 05113', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(129, 'Power Plant Engineering', 'EHT 05115', '9', 'LTP (4+2+0)', 'ELECTRICAL'),
(130, 'Hydropower Structure and Maintenance', 'EHT 05116', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(131, 'Basics of Pneumatics and Hydraulics Systems', 'IET 05111', '6', 'LTP (3+0+1)', 'ELECTRICAL'),
(132, 'Measurements and Instrumentation Technology', 'IET 05112', '9', 'LTP (0+0+6)', 'ELECTRICAL'),
(133, 'Sensors and Signal Conditioning', 'IET 05116', '9', 'LTP (4+0+2)', 'ELECTRICAL'),
(134, 'Analogue Electronics Design', 'ETT 06101', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(135, 'Applied Microcontrollers', 'ETT 06102', '9', 'LTP (1+1+3)', 'ELECTRICAL'),
(136, 'Automation', 'EET 06102', '8', 'LTP (1+0+4)', 'ELECTRICAL'),
(137, 'Coordinate Geometry and Differential Equations', 'GST 06101', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(138, 'Correspondence, Interpersonal Skills and Report writing', 'GST 06103', '4', 'LTP (2+0+0)', 'ELECTRICAL'),
(139, 'Electrical Power Protection', 'EET 06104', '5', 'LTP (3+1+0)', 'ELECTRICAL'),
(140, 'Induction Motors', 'EET 06101 / EHT 06103', '9', 'LTP (3+1+2)', 'ELECTRICAL'),
(141, 'Motor Rewinding/ Electrical Machine Rewinding', 'EET 06103 / EHT 06104', '9', 'LTP (3+0+2)', 'ELECTRICAL'),
(142, 'Radar and Navigation', 'ETT 06104', '10', 'LTP (3+1+3)', 'ELECTRICAL'),
(143, 'Television and Video Engineering', 'ETT 06103', '13', 'LTP (3+1+5)', 'ELECTRICAL'),
(144, 'Diagnostic Medical Equipment', 'EBT 06101', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(145, 'Human Physiology and Diagnostic Measurements', 'EBT 06103', '10', 'LTP (4+0+2)', 'ELECTRICAL'),
(146, 'Basic Design of Retaining Water Structures', 'EHT 06101', '8', 'LTP (3+1+0)', 'ELECTRICAL'),
(147, 'Environment and Social Impacts of small scale Hydropower Project', 'EHT 06102', '8', 'LTP (3+0+1)', 'ELECTRICAL'),
(148, 'Fundamentals of CAD', 'MET 06101', '7', 'LTP (2+2+0)', 'ELECTRICAL'),
(149, 'Solar Power Systems Installation', 'EST 06101', '9', 'LTP (3+2+1)', 'ELECTRICAL'),
(150, 'Wind Energy System Installation', 'EWT 06103', '8', 'LTP (1+0+3)', 'ELECTRICAL'),
(151, 'Project 1', 'EET/ ETT/ EBT/ EHT 06105', '4', 'LTP (2+0+0)', 'ELECTRICAL'),
(152, 'Advanced Calculus ', 'GSU 07111', '6', 'LTP (2+2+0)', 'DASS'),
(153, 'Basics of Calculus', 'GSU 07103', '6', 'LTP (3+1+0)', 'DASS'),
(155, 'Communication Skills for Engineers', 'GSU 07104', '6', 'LTP (3+1+0)', 'DASS'),
(157, 'Statics and Dynamics Mechanics ', 'MEU 07111', '6', 'LTP (2+1+0)', 'MECHANICAL'),
(158, 'Analogue Electronics', 'EAU 07113', '9', 'LTP (3+1+2)', 'ELECTRICAL'),
(159, 'Power Plants Engineering', 'EAU 07112', '6', 'LTP (3+2+0)', 'ELECTRICAL'),
(161, 'Electromagnetics', 'EAU 07114', '6', 'LTP (2+2+0)', 'ELECTRICAL'),
(162, 'Electrical Circuit Analysis', 'EAU 07115', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(163, 'Medical Equipment Technology and Installation', 'EBU 07111', '9', 'LTP (2+1+3)', 'ELECTRICAL'),
(164, 'Fundamentals of Renewable Energy Technologies', 'REU 07101', '9', 'LTP (4+0+2)', 'ELECTRICAL'),
(165, 'Energy Conversion Technologies', 'REU 07102', '9', 'LTP (3+0+2)', 'ELECTRICAL'),
(166, 'Fundamentals of Computer Aided Drafting', 'REU 07103', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(167, 'Applied Chemistry for Energy Engineering', 'REU 07104', '8', 'LTP (3+0+2)', 'ELECTRICAL'),
(168, 'Advanced Statistics', 'GSU07311', '6', 'LTP (3+1+0)', 'DASS'),
(169, 'Artificial Intelligence', 'EEU07313', '9', 'LTP (3+0+2)', 'ELECTRICAL'),
(170, 'Medical Physics and Imaging Technology', 'EBU07311', '9', 'LTP (3+0+2)', 'ELECTRICAL'),
(171, 'Switchgear and Power Protection', 'EAU 07311', '6', 'LTP (3+1+0)', 'ELECTRICAL'),
(172, 'Signal Analysis and Synthesis', 'EAU 07312', '9', 'LTP (3+2+0)', 'ELECTRICAL'),
(173, 'Power Electronics', 'EEU 07314', '9', 'LTP (3+0+3)', 'ELECTRICAL'),
(174, 'Microcontroller Programming in C++', 'EAU 07315', '12', 'LTP (2+0+6)', 'ELECTRICAL'),
(175, 'Industrial Internet of Things', 'EAU 07316', '6', 'LTP (3+0+1)', 'ELECTRICAL'),
(176, 'Solar Energy System', 'REU 07301', '10', 'LTP (2+0+6)', 'ELECTRICAL'),
(177, 'Manufacturing of Renewable Energy Systems Components.', 'REU 07302', '9', 'LTP (3+1+2)', 'ELECTRICAL'),
(178, 'AC Machines', 'EEU 07301', '9', 'LTP (3+2+0)', 'ELECTRICAL'),
(179, 'Differential Equations and Complex Variables', 'GSU 07301', '6', 'LTP (3+1+0)', 'DASS'),
(180, 'Industrial Management and Laws', 'GSU 07302', '6', 'LTP (3+1+0)', 'DASS'),
(181, 'Electronics Design and Fabrication', 'ETU 08105', '9', 'LTP (2+1+3)', 'ELECTRICAL'),
(182, 'Embedded System and Mobile Platform', 'ETU 08102', '7', 'LTP (2+1+2)', 'ELECTRICAL'),
(183, 'Microelectronics', 'ETU 08103', '7', 'LTP (3+1+0)', 'ELECTRICAL'),
(184, 'Real Time System ', 'ETU 08101', '6', 'LTP (2+1+0)', 'ELECTRICAL'),
(185, 'Robotics', 'ETU 08104', '7', 'LTP (2+1+2)', 'ELECTRICAL'),
(186, 'Hospital Information Technology and medical Informatics', 'EBU 08101', '7', 'LTP (3+1+0)', 'ELECTRICAL'),
(187, 'Medical Device and Microntroller Project 1', 'EBU 08102', '9', 'LTP (2+1+3)', 'ELECTRICAL'),
(188, 'Special Electric Machines', 'EEU 08101', '9', 'LTP (4+2+0)', 'ELECTRICAL'),
(189, 'High Voltage Engineering', 'EEU 08102', '7', 'LTP (3+1+0)', 'ELECTRICAL'),
(190, 'Numerical Optimization Methods', 'GSU 08103', '6', 'LTP (2+2+0)', 'DASS'),
(191, 'Industrial Safety and Maintenance', 'MEU 08101', '9', 'LTP (4+1+1)', 'MECHANICAL'),
(192, 'Wind Energy Technology', 'REU 08101', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(193, 'Power System Automation', 'REU 08102', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(194, 'Ocean Energy Technology', 'REU 08103', '9', 'LTP (2+0+4)', 'ELECTRICAL'),
(195, 'Project Feasibility Assessment', 'REU 08104', '9', 'LTP (4+1+0)', 'ELECTRICAL'),
(196, 'Project 1', 'EBU/EEU 08103/REU 08105', '10', 'LTP (3+0+5)', 'ELECTRICAL'),
(197, 'Basic Mechanics for Laboratory Technology', 'LST 04101', '9', 'LTP(3+2+0)', 'DASS'),
(198, 'Laboratory safety, procurement and organization', 'LST 04102', '8', 'LTP(3+1+0)', 'DASS'),
(199, 'Fundamentals of cell biology', 'LST 04104', '10', 'LTP(2+1+3)', 'DASS'),
(200, 'Specimen collection and preservation', 'LST 04105', '9', 'LTP(2+1+2)', 'DASS'),
(201, 'Laboratory techniques and preparation of reagents', 'LST 04103', '10', 'LTP(2+1+3)', 'DASS'),
(202, 'Basic Laboratory Instrumentation', 'LST 04106', '9', 'LTP(2+1+2)', 'DASS'),
(203, 'Algebra, Geometry and Statistics', 'GST 04113', '5', 'LTP(2+1+0)', 'DASS'),
(205, 'Algebra and Trigonometry', 'GST 04101/GST 04111', '5', 'LTP(2+1+0)', 'DASS'),
(206, 'Mechanics and Nuclear physics', 'GST 04102', '6', 'LTP(2+1+0)', 'DASS'),
(207, 'Fundamentals of Mechanics', 'GST 04112', '6', 'LTP(2+1+0)', 'DASS'),
(209, 'Principles of thermodynamics and optical Devices', 'LST 05102', '9', 'LTP(2+2+0)', 'DASS'),
(210, 'Fundamentals of Analogue electronics', 'LST 05103', '8', 'LTP(2+2+0)', 'DASS'),
(211, 'Basics of pesticides and phytochemistry', 'LST 05101', '8', 'LTP(2+1+2)', 'DASS'),
(212, 'Basics of plant and animal physiology', 'LST 05106', '8', 'LTP(2+2+1)', 'DASS'),
(213, 'Quantitative analysis', 'LST 05104', '9', 'LTP(2+1+2)', 'DASS'),
(214, 'Fundamentals of physical chemistry', 'LST 05105', '7', 'LTP(2+2+0)', 'DASS'),
(215, 'Thermochemistry and Chemical kinetics', 'LST 05107', '8', 'LTP(2+1+2)', 'DASS'),
(216, 'Differentiation and Integration', 'GST O5101', '5', 'LTP(2+1+0)', 'DASS'),
(220, 'Thermal Energy, Waves and Organic compounds', 'GST 05112', '6', 'LTP(2+2+0)', 'DASS'),
(221, 'Current Electricity and wave theory', 'LST 06101', '9', 'LTP(2+2+0)', 'DASS'),
(222, 'Electronics practicals', 'LST 06102', '9', 'LTP(1+1+3)', 'DASS'),
(223, 'Introduction to Immunology and parasitology', 'LST 06105', '9', 'LTP(2+2+0)', 'DASS'),
(224, 'Research techniques', 'LST 06107', '8', 'LTP(2+1+2)', 'DASS'),
(225, 'Analytical Instrumentation', 'LST 06103', '10', 'LTP(2+2+2)', 'DASS'),
(226, 'Organic chemistry', 'LST 06104', '8', 'LTP(2+2+0)', 'DASS'),
(229, 'Correspondence, Interpersonal Skills and Report writing', 'GST 06102/ GST 06103', '4', 'LTP(2+0+0)', 'DASS'),
(231, 'Organic Compounds', 'MBT 06102', '9', 'LTP(3+2+2)', 'DASS'),
(232, 'Workplace Communication', 'GST 06102', '5', 'LTP(2+0+0)', 'DASS'),
(233, 'Biological Techniques', 'LIU 07101', '10', 'LTP(1+1+3)', 'DASS'),
(234, 'Laboratory Safety', 'LIU 07104', '10', 'LTP(1+1+3)', 'DASS'),
(235, 'Analytical Instrumentation', 'LIU 07102', '12', 'LTP(1+1+5)', 'DASS'),
(236, 'Preparation of Chemical Solution and Bench Reagents', 'LIU 07103', '12', 'LTP(1+1+5)', 'DASS'),
(237, 'Advanced Calculus', 'GSU 07111/GSU 07101', '6', 'LTP(2+1+0)', 'DASS'),
(244, 'Chemistry for Hydrocarbons', 'LIU 07311', '8', 'LTP(1+3+0)', 'DASS'),
(245, 'Molecular Biology and Biotechnology', 'LIU 07312', '12', 'LTP(1+1+5)', 'DASS'),
(246, 'Laboaratory Risk Management', 'LIU 07313', '8', 'LTP(1+3+0)', 'DASS'),
(247, 'Applied Electronics', 'LIU 07314', '10', 'LTP(1+1+3)', 'DASS'),
(248, 'Principles of Thermodynamics', 'LIU 07315', '8', 'LTP(1+3+0)', 'DASS'),
(251, 'Human Resource Management', 'CIU 07316', '6', 'LTP(2+1+1)', 'DASS'),
(252, 'Advanced Statistics', 'GSU 07311', '6', 'LTP(2+1+0)', 'DASS'),
(255, 'Entrepreneurship for Engineers', 'GSU 08101', '6', 'LTP(2+0+0)', 'DASS'),
(259, 'BASICS OF ELECTRICAL AND ELECTRONICS ENGINEERING', 'PWT 04112', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(260, 'BASICS OF ENGINEERING DRAWING', 'MET 04111', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(261, 'BASICS OF ENGINEERING MATERIALS', 'MET 04112', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(262, 'BENCHWORK FOR PIPEWORKS', 'PWT 04113', '9', 'LTP(1.5+0+4.5)', 'MECHANICAL'),
(263, 'MECHANICAL ENGINEERING SCIENCE', 'MET 04113', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(264, 'PIPING COMPONENTS AND METERING', 'PWT 04111', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(265, 'BASICS OF AUTOMOTIVE TECHNOLOGY', 'MET 04114', '9', 'LTP(2+0+5)', 'MECHANICAL'),
(266, 'GENERAL WORKSHOP PRACTICEGENERAL WORKSHOP PRACTICE', 'MET 04115', '9', 'LTP(1.5+1+4.5)', 'MECHANICAL'),
(267, 'BASIC ELECTRICITY', 'EET 04101', '9', 'LTP(2+1+0)', 'ELECTRICAL'),
(268, 'BASICS OF ENGINEERING DRAWING', 'MET 04101', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(270, 'BASICS OF MANUFACTURING ENGINEERING', 'MET 04105', '12', 'LTP(2+1+5)', 'MECHANICAL'),
(271, 'ENERGY AND ENVIRONMENT', 'MBT 04101', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(273, 'MECHANICAL ENGINEERING MATERIALS', 'MET 04102', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(275, 'Introduction to Geology and Earths processes', 'GGT 04111', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(276, 'Fundamentals of Gemmology', 'GGT 04112', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(277, 'Occupational Health, Safety and Work Relations', 'GGT 04113', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(278, 'Basics of Land Surveying', 'GGT 04114', '6', 'LTP(2+1+5)', 'MECHANICAL'),
(279, 'Basics of Gemstone Cutting and Polishing', 'GGT 04115', '9', 'LTP(2+1+5)', 'MECHANICAL'),
(281, 'Differentiation and Integration', 'GST 05111', '6', 'LTP(2+1+0)', 'DASS'),
(283, 'Low and High Pressure Steam Piping Systems', 'PWT 05111', '9', 'LTP(2+1+5)', 'MECHANICAL'),
(284, 'Plumbing System Design', 'PWT 05112', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(285, 'Basics of machine elements and design', 'MET 05112', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(286, 'Fire Protection Piping Systems Design', 'PWT 05113', '6', 'LTP(2+1+5)', 'MECHANICAL'),
(287, 'Strength of materials', 'MET 05113', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(288, 'Basic Welding Technology', 'MET 05115', '12', 'LTP(2+1+5)', 'MECHANICAL'),
(289, 'Introduction to Programming Using C Language', 'GST 05113', '6', 'LTP(2+1+0)', 'ICT'),
(290, 'Detail and Assembly Drawings', 'MET 05111', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(292, 'Applied Thermodynamics', 'MET 05114', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(293, 'ASSESSMENT OF BIOMASS TECHNOLOGY', 'MBT 05103', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(294, 'BASICS OF MACHINE ELEMENTS AND DESIGN', 'MET 05104', '5', 'LTP(2+1+0)', 'MECHANICAL'),
(295, 'DIFFERENTIATION AND INTEGRATION', 'GST 05101', '5', 'LTP(2+1+0)', 'DASS'),
(296, 'ENGINEERING THERMODYNAMICS', 'MET 05107', '4', 'LTP(2+1+0)', 'MECHANICAL'),
(297, 'INTRODUCTION TO C PROGRAMMING', 'GST 05103', '6', 'LTP(2+1+0)', 'ICT'),
(299, 'SECTIONING, DEVELOPMENT, AND INTERPENETRATION DRAWINGS', 'MET 05101', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(300, 'STRENGTH OF MATERIALS', 'MET 05102', '4', 'LTP(2+1+0)', 'MECHANICAL'),
(302, 'WELDING AND METAL FABRICATION', 'MET 05103', '12', 'LTP(2+1+5)', 'MECHANICAL'),
(305, 'Domestic and Commercial Gas Fired Appliances', 'MET 06110', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(306, 'Environmental Engineering', 'MET 06106', '4', 'LTP(2+1+0)', 'MECHANICAL'),
(307, 'Fundamental of Gas Technology and Processing', 'MET 06108', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(309, 'Gas Piping, Operation and System Planning', 'MET 06109', '10', 'LTP(2+1+5)', 'MECHANICAL'),
(310, 'Machine Elements and Design', 'MET 06102', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(311, 'Power Production', 'MET 06104', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(312, 'Engineering Project - Design', 'MET 06111', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(313, 'Advanced Manufacturing Technology', 'MET 06103', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(318, 'Fundamentals of Refrigeration Systems', 'MET 06105', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(321, 'Mechanical Engineering Project - Design', 'MET 06107', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(322, 'Construction of Gasifiers', 'MBT 06101', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(329, 'Bioenergy Project I', 'MBT 06103', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(331, 'BASICS OF ELECTRICAL INSTALLATION', 'MMU 07113', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(334, 'BASICS OF ENGINEERING MATERIAL', 'MEU 07112', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(336, 'FITTING AND SHEET METAL WORKSHOP PRACTICE', 'MEU 07113', '12', 'LTP(2+1+6)', 'MECHANICAL'),
(337, 'FUNDAMENTALS OF ELECTRICITY AND ELECTRONICS', 'MMU 07112', '9', 'LTP(2+1+0)', 'ELECTRICAL'),
(338, 'BASICS OF ELECTRICAL INSTALLATION', 'MMU07113', '9', 'LTP(2+1+0)', 'ELECTRICAL'),
(342, 'ANALOGUE ELECTRONICS', 'EAU 07317', '6', 'LTP(2+1+0)', 'ELECTRICAL'),
(343, 'ENTREPRENEURSHIP FOR ENGINEERS', 'GSU 07314', '6', 'LTP(2+1+0)', 'DASS'),
(344, 'MATERIAL TECHNOLOGY', 'MEU 07314', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(345, 'MECHANICS OF MACHINES', 'MEU 07313', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(346, 'PIPING ENGINEERING', 'MEU 07315', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(347, 'PRINCIPLES OF METAL CUTTING', 'MEU 07312', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(348, 'TECHNICAL COMMUNICATION SKILLS', 'GSU 07313', '6', 'LTP(2+1+0)', 'DASS'),
(349, 'WORKSHOP TECHNOLOGY', 'MEU 07311', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(350, 'Advanced Statistics', 'GSU 07511', '6', 'LTP(2+1+0)', 'DASS'),
(351, 'Digital Manufacturing', 'MMU 07511', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(352, 'Materials Characterization', 'MMU 07512', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(354, 'Heating, Ventilation and Air Conditioning', 'MEU 07511', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(355, 'Power Electronics and Motor Drives', 'MMU 07513', '9', 'LTP(2+1+3)', 'MECHANICAL'),
(356, 'AUTOMOTIVE TECHNOLOGY', 'MEU 08107', '10', 'LTP(2+1+3)', 'MECHANICAL'),
(357, 'ENGINEERING PROJECT DESIGN', 'MEU 08108', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(358, 'INDUSTRIAL PROCESS CONTROL', 'MEU 08104', '6', 'LTP(2+1+5)', 'MECHANICAL'),
(359, 'INDUSTRIAL REFRIGERATION', ' MEU 08102', '6', 'LTP(2+1+3)', 'MECHANICAL'),
(361, 'POWER PLANT ENGINEERING', 'MEU 08105', '9', 'LTP(2+1+0)', 'MECHANICAL'),
(362, 'QUALITY ASSURANCE AND CONTROL', 'MEU 08106', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(363, 'ENERGY STORAGE AND CONVERSION TECHNOLOGIES', 'MMU 08101', '6', 'LTP(2+1+0)', 'MECHANICAL'),
(365, 'MATERIAL HANDLING SYSTEMS', 'MEU 08103', '7', 'LTP(2+1+0)', 'MECHANICAL'),
(366, 'MATERIALS DEGRADATION AND CORROSION', 'MMU 08102', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(367, 'MECHATRONIC-MATERIALS CAPSTONE PROJECT I', 'MMU 08103', '10', 'LTP(2+1+0)', 'MECHANICAL'),
(372, 'Building Construction and Maintenance', 'CIT/CET/CHT 04111', '9', '6', 'H-WAY'),
(373, 'Soil Mechanics', 'CIT/CET/CHT 04112', '10', '7', 'AUTOMOTIVE'),
(374, 'Basics of Engineering Drawing', 'AUT 04111', '6', '6', 'AUTOMOTIVE'),
(375, 'Basic Electrical and Electronics Engineering', 'AET 04111', '5', 'TP(3+5)', 'AUTOMOTIVE'),
(377, 'Engineering Materials', 'AUT 04114', '4', 'T(3)', 'AUTOMOTIVE'),
(378, 'Internal Combustion Engines ', 'AUT 04113', '12', 'TP(3+5)', 'AUTOMOTIVE'),
(379, 'Automotive Technology  ', 'AUT 04112', '12', 'TP(3+5)', 'AUTOMOTIVE'),
(381, 'Workshop safety and tools', 'HET 04101', '8', 'TP(3+5)', 'AUTOMOTIVE'),
(382, 'Fundamental of engine and traction', 'HET 04102', '8', 'TP(3+5)', 'AUTOMOTIVE'),
(383, 'Fundamental of Programming using C', 'CST 05113', '6', '5', 'ICT'),
(384, 'Automotive Chassis Systems maintenance', 'AUT 05111', '12', 'TP(3+5)', 'AUTOMOTIVE'),
(385, 'Strength of materials', 'AUT 05112', '12', '6', 'AUTOMOTIVE'),
(386, 'Basic of Machine Elements and Design', 'AUT 05113', '6', '6', 'AUTOMOTIVE'),
(387, 'Computer Aided Drafting (CAD)', 'AUT 05114', '6', '4', 'AUTOMOTIVE'),
(388, 'Engineering Thermodynamics', 'AUT 05115', '10', '6', 'AUTOMOTIVE'),
(389, 'Maintenance of Hydraulic and Pneumatic Systems', 'HET 05101', '15', 'TP(4+5)', 'AUTOMOTIVE'),
(390, 'Automotive Diagnosis', 'AET 06112', '8', 'TP(2+3)', 'AUTOMOTIVE'),
(391, 'Automotive Workshop Management', 'AET 06111', '8', '5', 'AUTOMOTIVE'),
(392, 'Engine Electronic Control Systems', 'AET 06125', '10', 'TP(3+5)', 'AUTOMOTIVE'),
(393, 'Project Design', 'AET 06110', '9', '6', 'AUTOMOTIVE'),
(394, 'Basic Electrical Test Procedures ', 'AET 06114', '7', 'TP(2+5)', 'AUTOMOTIVE'),
(395, 'Battery, Starting and Charging Systems ', 'AET 06113', '8', 'TP(2+5)', 'AUTOMOTIVE'),
(396, 'Electrical and Electronic Principles', 'AET 06117', '7', '5', 'AUTOMOTIVE'),
(397, 'Electrical Faults and Test Equipment', 'AET 06116', '5', 'TP(3+5)', 'AUTOMOTIVE'),
(398, 'Ignition and Engine Control Systems Service ', 'AET 06115', '7', 'TP(2+5)', 'AUTOMOTIVE'),
(399, 'Project Design', 'AET 06118', '5', '3', 'AUTOMOTIVE'),
(400, 'Automotive Engineering Science', 'AET 06108', '13', '8', 'AUTOMOTIVE'),
(401, 'Basic Hydraulic and Pneumatic Design', 'HET 06101', '6', '4', 'AUTOMOTIVE'),
(402, 'Hydraulic and Pneumatic System Controls', 'HET 06102', '8', 'TP(3+5)', 'AUTOMOTIVE'),
(403, 'Project- Design', 'HET 06103', '4', '3', 'AUTOMOTIVE'),
(404, 'Internal Combustion Engines', 'AEU 07111', '12', 'TP(8+5)', 'AUTOMOTIVE'),
(405, 'Automotive Brake Systems', 'AEU 07112', '12', 'TP(4+5)', 'AUTOMOTIVE'),
(406, 'Material Engineering and Technology', 'AEU 07113', '9', '4', 'AUTOMOTIVE'),
(407, 'Automotive Technology', 'AEU 07114', '6', 'TP(4+5)', 'AUTOMOTIVE'),
(408, 'Analogue Electronics', 'ETU 07111', '9', 'TP(4+5)', 'ELECTRICAL'),
(409, 'Automotive Drive Train Systems', 'AEU 07311', '12', 'TP(3+5)', 'AUTOMOTIVE'),
(410, 'Microcontroller programming in C++', 'ETU 07311', '12', '8', 'AUTOMOTIVE'),
(411, 'Automotive Heating, Ventilation and Air Conditioning ', 'AEU 07312', '12', 'TP(3+5)', 'AUTOMOTIVE'),
(412, 'Engineering Measurements and Instrumentation ', 'AEU 07313', '9', 'TP(3+5)', 'AUTOMOTIVE'),
(413, 'Automotive Power Electronics and Motor Drives', 'AEU 07314', '15', 'TP(3+5)', 'AUTOMOTIVE'),
(414, 'Automotive Maintenance Management', 'AEU 07315', '6', '4', 'AUTOMOTIVE'),
(416, 'Basic Engineering Drawing', 'CIT/CET/CHT 04113', '9', '6', 'CIVIL'),
(417, 'Construction Technology (Masonry, Carpentry)', 'CIT/CET/CHT 04114', '9', '6', 'H-WAY'),
(418, 'Basics of Irrigation Engineering', 'CIT 04115', '10', '7', 'CIVIL'),
(419, 'Aluminium and finishing work in building. (Aluminium fixing, Painting, Wallpaper, Tiles, Terrazzo and Decor)', 'CET 04115', '10', '7', 'CIVIL'),
(420, 'Basic Labour Based Road Engineering', 'CHT 04115', '12', '8', 'H-WAY'),
(421, 'Engineering Surveying', 'CET/CIT 05111/CHT 05120', '9', '5', 'H-WAY'),
(422, 'Engineering Drawing (CAD)', 'CET/CIT 05112/CHT 05121', '9', '5', 'H-WAY'),
(423, 'Civil Engineering  Materials ', 'CET/CIT 05113/CHT 05122', '10', '7', 'CIVIL'),
(424, 'Road Design', 'CET/CIT 05114/CHT 05123', '6', '5', 'H-WAY'),
(425, 'Water Supply and Sanitation', 'CET/CIT 05115/CHT 05124', '9', '6', 'H-WAY'),
(426, 'Fundamental of Soil Science', 'CIT 05226', '3', '2', 'H-WAY'),
(427, 'Hydraulics and Fluid Mechanics I', 'CED 06125', '5', '4', 'H-WAY'),
(428, 'Reinforced Cement Concrete Design', 'CED 06119', '6', '4', 'H-WAY'),
(429, 'Introduction to Irrigation Engineering', 'CIT 06101', '3', '2', 'CIVIL'),
(430, 'Irrigation Water Supply', 'CIT 06102', '6', '3', 'CIVIL'),
(431, 'Collection and Analysis of Hydrological Data', 'CIT 06103', '4', '2', 'CIVIL'),
(432, 'Soil Analysis for Irrigation', 'CIT 06104', '4', '2', 'CIVIL'),
(433, 'Irrigation Surveying', 'CIT 06105', '6', '4', 'CIVIL'),
(434, 'Project I (Introduction to Research Methodology and Project Proposal Writing)', 'CIT 06125', '9', '6', 'CIVIL'),
(435, 'Building Construction ', 'CED 06120', '9', '4', 'CIVIL'),
(436, 'Reinforced Cement Concrete Design', 'CED 06121', '9', '6', 'CIVIL'),
(437, 'Soil Mechanics and Foundations', 'CED 06122', '9', '6', 'CIVIL'),
(438, 'Structural Timber Design', 'CED 06123', '9', '5', 'CIVIL'),
(439, 'Architectural Design and Drawing ', 'CED 06124', '9', '6', 'CIVIL'),
(441, 'Route Design ', 'CHT 06120', '9', '6', 'H-WAY'),
(442, 'Pavement Materials ', 'CHT 06129', '9', '6', 'H-WAY'),
(443, 'Reinforced Cement Concrete Design', 'CHT 06121', '9', '7', 'H-WAY'),
(444, 'Traffic and Transportation Engineering ', 'CHT 06124', '9', '5', 'H-WAY'),
(445, 'Structural Timber Design', 'CHT 06123', '6', '4', 'H-WAY'),
(446, 'Soil Mechanics and Foundations ', 'CHT 06122', '9', '5', 'H-WAY'),
(447, 'Basic Bridge Construction and Maintenance', 'CHT 06126', '6', '4', 'H-WAY'),
(448, 'Project I (Introduction to Research Methodology and Project Proposal Writing)', 'CHT 06125', '5', '6', 'H-WAY'),
(449, 'Engineering surveying', 'CIU/CEU/CHU 07111', '9', '5', 'H-WAY'),
(450, 'Building planning and Drawing', 'CIU/CEU/CHU 07112', '6', '4', 'CIVIL'),
(451, 'Civil Engineering Material', 'CIU/CEU/CHU 07113', '9', '6', 'CIVIL'),
(452, 'Construction Technology ', 'CIU/CEU 07114', '6', '4', 'CIVIL'),
(453, 'Basics of Soil Mechanics', 'CIU/CEU 07115', '6', '5', 'CIVIL'),
(454, 'Introduction to Soil Science', 'CIU 07116', '6', '4', 'CIVIL'),
(455, 'Building Construction', 'CHU 07114', '9', '6', 'CIVIL'),
(456, 'Strength of Materials', 'CHU 07115', '6', '4', 'H-WAY'),
(457, 'Geotechnical Engineering', 'CIU 07311', '9', '6', 'CIVIL'),
(458, 'Structural Analysis', 'CIU 07312', '9', '5', 'CIVIL'),
(459, 'Reinforced Concrete Design I', 'CIU 07313', '9', '5', 'CIVIL'),
(460, 'Open Channel Hydraulics', 'CIU 07314', '6', '5', 'CIVIL'),
(461, 'Engineering Hydrology and Meteorology', 'CIU 07315', '6', '4', 'CIVIL'),
(463, 'Design of Pressurized Irrigation System', 'CIU 07317', '9', '5', 'CIVIL'),
(464, 'Geotechnical Engineering', 'CEU 07311', '9', '6', 'CIVIL'),
(465, 'Structural Analysis', 'CEU 07312', '9', '6', 'CIVIL'),
(466, 'Reinforced Concrete Design I', 'CEU 07313', '9', '6', 'CIVIL'),
(467, 'Open Channel Hydraulics', 'CEU 07314', '9', '5', 'CIVIL'),
(468, 'Engineering Hydrology', 'CEU 07315', '6', '4', 'CIVIL'),
(469, 'River and Reservoir Operation', 'CEU 07316', '9', '6', 'CIVIL'),
(470, 'Highway Geometric Design', 'CHU 07311', '9', '5', 'H-WAY'),
(471, 'Engineering Geology', 'CHU 07312', '6', '4', 'CIVIL'),
(472, ' Measurement and Estimation of Civil Works', 'CHU 07313', '6', '5', 'CIVIL'),
(473, 'Structural Analysis', 'CHU 07314', '6', '4', 'CIVIL'),
(474, 'Construction Management', 'CHU 07315', '6', '4', 'CIVIL'),
(475, 'Reinforced Concrete Design', 'CHU 07316', '9', '6', 'CIVIL'),
(476, 'Open Channel Hydraulics', 'CHU 07317', '6', '4', 'CIVIL'),
(477, 'Construction Technology', 'CHU 07318', '6', '4', 'CIVIL'),
(478, 'Social and Environmental Management Planning', 'CIU 08101', '9', '6', 'CIVIL'),
(479, 'Contract Management', 'CIU 08102', '8', '6', 'CIVIL'),
(480, 'Groundwater Engineering', 'CIU 08103', '9', '6', 'CIVIL'),
(481, 'Reinforced Cement Concrete Design', 'CIU 08104', '6', '4', 'CIVIL'),
(482, 'Site Management', 'CIU 08105', '6', '4', 'CIVIL'),
(483, 'Water Supply and Public Health Engineering', 'CIU 08106', '9', '4', 'CIVIL'),
(484, 'Project I', 'CIU 08107', '10', '4', 'CIVIL'),
(485, 'Social and Environmental Management Planning', 'CHU 08101', '6', '4', 'CIVIL'),
(487, 'Transportation Engineering', 'CHU 08102', '6', '4', 'CIVIL'),
(488, 'Structural Steel Design', 'CHU 08103', '8', '6', 'CIVIL'),
(489, 'Soil Technology', 'CHU 08104', '8', '6', 'CIVIL'),
(490, 'Highway Engineering Material', 'CHU 08105', '8', '6', 'H-WAY'),
(491, 'Construction Technology Services', 'CHU 08106', '3', '2', 'CIVIL'),
(492, 'Solid Waste Management', 'CHU 08107', '4', '3', 'CIVIL'),
(493, 'Project Data Collection', 'CHU 08108', '8', '4', 'CIVIL'),
(494, 'Bridge Design,Construction and Maintenance', 'CHU 08109', '6', '4', 'CIVIL'),
(495, 'Hydraulic Structures', 'CHU 08110', '3', '2', 'CIVIL'),
(496, 'Design software Practices', 'CHU 08111', '6', '4', 'CIVIL');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `credit` int(11) DEFAULT 0,
  `total_hours_per_week` int(11) DEFAULT 0,
  `program_id` int(11) NOT NULL,
  `subject_department` varchar(255) NOT NULL,
  `type_prac_or_theory` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `subject_code` varchar(255) NOT NULL,
  `semester` varchar(255) DEFAULT NULL,
  `ltpa` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `title`, `credit`, `total_hours_per_week`, `program_id`, `subject_department`, `type_prac_or_theory`, `user_id`, `subject_code`, `semester`, `ltpa`) VALUES
(30, 'Design software Practices', 6, 2, 5, 'CIVIL', 'Theory', 4, 'CHU 08111', 'I', 2.25),
(31, 'Design software Practices', 6, 3, 27, 'CIVIL', 'Theory', 4, 'CHU 08111', 'I', 0.75),
(32, 'Design software Practices', 6, 3, 7, 'CIVIL', 'Theory', 4, 'CHU 08111', 'I', 0.75),
(33, 'Design software Practices', 6, 3, 7, 'CIVIL', 'Theory', 10, 'CHU 08111', 'I', 0.00),
(34, 'Solid Waste Management', 4, 3, 7, 'CIVIL', 'Theory', 10, 'CHU 08107', 'I', 0.75);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `department`, `user_email`, `role`, `password`, `status`) VALUES
(4, 'Baraka', 'MECHANICAL', 'baraka1@mgala.com', 'tmaster', '$2b$04$F2bu8BeAK3P.n.Mo4aQq8ecmPiAxjiO4d3OeYI1v.LjulYOgdob6y', 'ACTIVE'),
(10, 'Moshi, F', 'ATC', 'moshi@atc.ac.tz', 'hod', '$2b$04$J2JCKCxcRQpoaXO1VUTw2O6lepqPB8//3b/33ngPLoTqc8T.67WJO', 'ACTIVE'),
(11, 'Kotini, J', 'ICT', 'kotini@atc.ac.tz', 'tutor', '$2b$04$9ckxTIUd3DjeWzpnc8FLFezZPcoZiQdU.MiTuHTi8eawESSigoBSi', 'ACTIVE'),
(12, 'Mkumba, C', 'ATC', 'Mkumba@atc.ac.tz', 'tutor', '$2b$04$fWNhhywwCOdhI53YrI140OwKfnm6UByEhEz5M3Re667CNZl1puIvy', 'ACTIVE'),
(13, 'David, R', 'ATC', 'David@atc.ac.tz', 'tutor', '$2b$04$Pdwg3rdjSmnWAYgmUXAmVO.W0SNOYVi6/6I3/dbMJcUAADM5tdiJ2', 'ACTIVE'),
(14, 'Mtunguja, D', 'ATC', 'mtunguja@atc.ac.tz', 'tutor', '$2b$04$gNVovXtuOkqofGFjVwicMushTqKXcov9GMYhHySrGhtROpug/sf1C', 'ACTIVE'),
(15, 'Maginga, S', 'ATC', 'maginga@atc.ac.tz', 'tutor', '$2b$04$zltX1QS5Iajfj9M.3zxNCOpm8rgct50Tc/xQ2949WK0F3fbKEhFCS', 'ACTIVE'),
(16, 'Gunda, J', 'ATC', 'gunda@atc.ac.tz', 'tutor', '$2b$04$SnRbH5Z8JrnVyW3OUvednOZ9FzwARFLkAUuGo7OJ4Dj7S4LTlE.iC', 'ACTIVE'),
(17, 'Sabigoro, R', 'ATC', 'sabigoro@atc.ac.tz', 'tutor', '$2b$04$aShhirjs3FeSmvhWdt8bPuhBp8JyXA00nyrXAqblaoGmXf4H5qIdy', 'ACTIVE'),
(18, 'Dr. Mwanza, J', 'ATC', 'dr.Mwanza@atc.ac.tz', 'tutor', '$2b$04$wD5IQVm/Yhbwbz7wu3ieW.zaQdAFolPRYEvXedoV2vYxukctxdaRO', 'ACTIVE'),
(19, 'Hassan, A', 'ATC', 'hassan@atc.ac.tz', 'tutor', '$2b$04$dqU33fpC2UFspLkoVAMfCu13N8sGMBzt/SDRLXbQBIVRyNjMgexHS', 'ACTIVE'),
(20, 'Mgaya, G', 'ATC', 'mgaya@atc.ac.tz', 'tutor', '$2b$04$.CvtUgGWeb5AdhYOPJ2SluqvEtFM3U3xCKXcbtDNt15duQVS7jCEW', 'ACTIVE'),
(21, 'Dr. Ngoma,D', 'ATC', 'ngoma@atc.ac.ac', 'tutor', '$2b$04$LxYyvdgCdHuUq2lwvqoLWu9WjkSWCjffBugVEbCgEIO2ojGnlp4mO', 'ACTIVE'),
(22, 'Milyaso, E', 'ATC', 'Milyaso@atc.ac.tz', 'tutor', '$2b$04$uxQqqkKJ84e4i6diK3/N7.usWb1DW1nZgLO14tuxLtMh/wbQagPKG', 'ACTIVE'),
(23, 'Shayo, A', 'ATC', 'Shayo@atc.ac.tz', 'tutor', '$2b$04$JpZG0hrk2r8VAxj9ugc.oOupQFsBXrQHUibZpvpEzLbRi7VxqoCwe', 'ACTIVE'),
(24, 'Mkacha, R', 'ATC', 'Mkacha@atc.ac.tz', 'tutor', '$2b$04$yThxBSxT3oa3zGwvxeaRSuBZefmBz96ZBnxqArprQPmBkrasLx0QO', 'ACTIVE'),
(25, 'Fabian, J', 'ATC', 'Fabian@atc.ac.tz', 'tutor', '$2b$04$8r.GFH39vIeGo5uhqVvLFOeIkXj6JKfvcvO2he4dY.bNKpMgKkxO6', 'ACTIVE'),
(26, 'Mwahu, H', 'ATC', 'Mwahu@atc.ac.tz', 'tutor', '$2b$04$yU4WmqMV4ngiKZnWMnxzX.N0o0/skE6ZJ7nJQ0/zURkFD7qYYkBhu', 'ACTIVE'),
(27, 'Mhusa, N', 'ATC', 'Mhusa@atc.ac.tz', 'tutor', '$2b$04$FQbBncJR0i3vfWFL6tBcpOV44jg2L7gCGXhIEEA9egeJCCudep8kW', 'ACTIVE'),
(28, 'Petro, L', 'ATC', 'Petro@atc.ac.tz', 'tutor', '$2b$04$AqninfHk2RgMGvJp5GORN./dhpBhJUGAIzSRU01ZVau9BxGG2yaQu', 'ACTIVE'),
(29, 'Busumabu', 'ATC', 'Busumabu@atc.ac.tz', 'tutor', '$2b$04$Ql8nVddWO6rlB377Lw1W0OcRLptNPGwHhyF6cgsxDdGTiDWVlAA72', 'ACTIVE'),
(231, 'Mr Kengia T', 'ATC', 'Kengia@atc.ac.tz', 'tutor', '123', 'active'),
(232, 'Ms Dr. Mwenisongole C', 'ATC', 'Mwenisongole@atc.ac.tz', 'tutor', '123', 'active'),
(233, 'Mr Sambayukha G', 'ATC', 'Sambayukha@atc.ac.tz', 'tutor', '123', 'active'),
(234, 'Mr Mgoge J M', 'ATC', 'Mgoge@atc.ac.tz', 'tutor', '123', 'active'),
(235, 'Mr Chifupa A', 'ATC', 'Chifupa@atc.ac.tz', 'tutor', '123', 'active'),
(236, 'Mr Sospeter I', 'ATC', 'Sospeter@atc.ac.tz', 'tutor', '123', 'active'),
(237, 'Mr Mankala J', 'ATC', 'Mankala@atc.ac.tz', 'tutor', '123', 'active'),
(238, 'Mr Omary A', 'ATC', 'Omary@atc.ac.tz', 'tutor', '123', 'active'),
(239, 'Mr Anael R', 'ATC', 'Anael@atc.ac.tz', 'tutor', '123', 'active'),
(240, 'Mr Mjankwi A M', 'ATC', 'Mjankwi@atc.ac.tz', 'tutor', '123', 'active'),
(241, 'Mr Mshana G', 'ATC', 'Mshana@atc.ac.tz', 'tutor', '123', 'active'),
(242, 'Mr Kanyonga L', 'ATC', 'Kanyonga@atc.ac.tz', 'tutor', '123', 'active'),
(243, 'Mr Ambrose G', 'ATC', 'Ambrose@atc.ac.tz', 'tutor', '123', 'active'),
(244, 'Ms Mwanaidi T', 'ATC', 'Mwanaidi@atc.ac.tz', 'tutor', '123', 'active'),
(245, 'Mr Mbitila A S', 'ATC', 'Mbitila@atc.ac.tz', 'tutor', '123', 'active'),
(246, 'Mr Shoo A F', 'ATC', 'Shoo@atc.ac.tz', 'tutor', '123', 'active'),
(247, 'Mr Slaa, Q', 'ATC', 'Slaa@atc.ac.tz', 'tutor', '123', 'active'),
(248, 'Ms Sikawa E P', 'ATC', 'Sikawa@atc.ac.tz', 'tutor', '123', 'active'),
(249, 'Ms Mwase D', 'ATC', 'Mwase@atc.ac.tz', 'tutor', '123', 'active'),
(250, 'Ms Msaki, C', 'ATC', 'Msaki@atc.ac.tz', 'tutor', '123', 'active'),
(251, 'Mr Mang’ehe, D', 'ATC', 'Mang’ehe@atc.ac.tz', 'tutor', '123', 'active'),
(252, 'Mr John, N', 'ATC', 'John@atc.ac.tz', 'tutor', '123', 'active'),
(253, 'Mr Mbelwa, M', 'ATC', 'Mbelwa@atc.ac.tz', 'tutor', '123', 'active'),
(254, 'Mr Ngulugulu, A', 'ATC', 'Ngulugulu@atc.ac.tz', 'tutor', '123', 'active'),
(255, 'Mr Mutajunwa, C', 'ATC', 'Mutajunwa@atc.ac.tz', 'tutor', '123', 'active'),
(256, 'Mr Kassi, E', 'ATC', 'Kassi@atc.ac.tz', 'tutor', '123', 'active'),
(257, 'Mr Nkota, F', 'ATC', 'Nkota@atc.ac.tz', 'tutor', '123', 'active'),
(258, 'Mr Sademaki, S', 'ATC', 'Sademaki@atc.ac.tz', 'tutor', '123', 'active'),
(259, 'Mr Mmbando, J', 'ATC', 'Mmbando@atc.ac.tz', 'tutor', '123', 'active'),
(260, 'Mr Mwayinga, W', 'ATC', 'Mwayinga@atc.ac.tz', 'tutor', '123', 'active'),
(261, 'Mr Lupenza, L', 'ATC', 'Lupenza@atc.ac.tz', 'tutor', '123', 'active'),
(262, 'Mr Mejooli, M', 'ATC', 'Mejooli@atc.ac.tz', 'tutor', '123', 'active'),
(263, 'Mr Dr. Mbuya, B', 'ATC', 'Mbuya@atc.ac.tz', 'tutor', '123', 'active'),
(264, 'Mr Mkongwa, K', 'ATC', 'Mkongwa@atc.ac.tz', 'tutor', '123', 'active'),
(265, 'Mr Sumari, S', 'ATC', 'Sumari@atc.ac.tz', 'tutor', '123', 'active'),
(354, 'Dr. Msafiri, N', 'ATC', 'Msafiri@atc.ac.tz', 'tutor', '123', 'active'),
(355, 'Mushi, T', 'ATC', 'Mushi@atc.ac.tz', 'tutor', '123', 'active'),
(356, 'Dr. Mgaya, E', 'ATC', 'Mgaya1@atc.ac.tz', 'tutor', '123', 'active'),
(357, 'Killo, O', 'ATC', 'Killo@atc.ac.tz', 'tutor', '123', 'active'),
(358, 'Dr. Melkior, U', 'ATC', 'Melkior@atc.ac.tz', 'tutor', '123', 'active'),
(359, 'Msuya, A', 'ATC', 'Msuya@atc.ac.tz', 'tutor', '123', 'active'),
(360, 'Mwakatage, S', 'ATC', 'Mwakatage@atc.ac.tz', 'tutor', '123', 'active'),
(361, 'Lyimo, J', 'ATC', 'Lyimo@atc.ac.tz', 'tutor', '123', 'active'),
(362, 'Dr. Iddi, I', 'ATC', 'Iddi@atc.ac.tz', 'tutor', '123', 'active'),
(363, 'Sarakikya, H', 'ATC', 'Sarakikya@atc.ac.tz', 'tutor', '123', 'active'),
(364, 'Kiyowele, Y', 'ATC', 'Kiyowele@atc.ac.tz', 'tutor', '123', 'active'),
(365, 'Joseph, D C', 'ATC', 'Joseph@atc.ac.tz', 'tutor', '123', 'active'),
(366, 'Saliungu, B', 'ATC', 'Saliungu@atc.ac.tz', 'tutor', '123', 'active'),
(367, 'Sulle, B', 'ATC', 'Sulle@atc.ac.tz', 'tutor', '123', 'active'),
(368, 'Haymale, H', 'ATC', 'Haymale@atc.ac.tz', 'tutor', '123', 'active'),
(369, 'Mwakosya, I', 'ATC', 'Mwakosya@atc.ac.tz', 'tutor', '123', 'active'),
(370, 'Mtavangu, D', 'ATC', 'Mtavangu@atc.ac.tz', 'tutor', '123', 'active'),
(371, 'Msuya, E', 'ATC', 'Msuya1@atc.ac.tz', 'tutor', '123', 'active'),
(372, 'Mhina, S', 'ATC', 'Mhina@atc.ac.tz', 'tutor', '123', 'active'),
(373, 'Mangara, J', 'ATC', 'Mangara@atc.ac.tz', 'tutor', '123', 'active'),
(374, 'Migunzu, R', 'ATC', 'Migunzu@atc.ac.tz', 'tutor', '123', 'active'),
(375, 'Msumari, A', 'ATC', 'Msumari@atc.ac.tz', 'tutor', '123', 'active'),
(376, 'Zongoro, S', 'ATC', 'Zongoro@atc.ac.tz', 'tutor', '123', 'active'),
(377, 'Dr. Mosha, R', 'ATC', 'Mosha@atc.ac.tz', 'tutor', '123', 'active'),
(378, 'ICT', 'ATC', 'ICT@atc.ac.tz', 'tutor', '123', 'active'),
(379, 'COORDINATOR', 'ATC', 'COORDINATOR@atc.ac.tz', 'tutor', '123', 'active'),
(380, 'SELESTINE, S', 'ATC', 'SELESTINE@atc.ac.tz', 'tutor', '123', 'active'),
(381, 'MJEMA, A', 'ATC', 'MJEMA@atc.ac.tz', 'tutor', '123', 'active'),
(382, 'DOTTO, C', 'ATC', 'DOTTO@atc.ac.tz', 'tutor', '123', 'active'),
(383, 'Missana, W', 'ATC', 'Missana@atc.ac.tz', 'tutor', '123', 'active'),
(384, 'DEUS, M', 'ATC', 'DEUS@atc.ac.tz', 'tutor', '123', 'active'),
(385, 'MABOJANO, J', 'ATC', 'MABOJANO@atc.ac.tz', 'tutor', '123', 'active'),
(386, 'ISSA, S', 'ATC', 'ISSA@atc.ac.tz', 'tutor', '123', 'active'),
(387, 'CYLIACUS, S', 'ATC', 'CYLIACUS@atc.ac.tz', 'tutor', '123', 'active'),
(388, 'ASSEY, R', 'ATC', 'ASSEY@atc.ac.tz', 'tutor', '123', 'active'),
(389, 'Lissah, J', 'ATC', 'Lissah@atc.ac.tz', 'tutor', '123', 'active'),
(390, 'MTAKATI, B', 'ATC', 'bmtakati@atc.ac.tz', 'tutor', '123', 'active'),
(391, 'SIMALIKE, P', 'ATC', 'SIMALIKE@atc.ac.tz', 'tutor', '123', 'active'),
(392, 'MMARI, J', 'ATC', 'MMARI@atc.ac.tz', 'tutor', '123', 'active'),
(393, 'Nkata, A', 'ATC', 'Nkata@atc.ac.tz', 'tutor', '123', 'active'),
(394, 'JANUARY, F', 'ATC', 'JANUARY@atc.ac.tz', 'tutor', '123', 'active'),
(395, 'KIROBO, A', 'ATC', 'KIROBO@atc.ac.tz', 'tutor', '123', 'active'),
(396, 'KISIRI, J', 'ATC', 'jkisiri@atc.ac.tz', 'tutor', '123', 'active'),
(397, 'SAID, J', 'ATC', 'SAID@atc.ac.tz', 'tutor', '123', 'active'),
(798, 'NGOMA, A', 'ATC', 'NGOMA@atc.ac.tz', 'tutor', '123', 'active'),
(799, 'Premji, S', 'ATC', 'Premji@atc.ac.tz', 'tutor', '123', 'active'),
(800, 'NEW TUTOR LJT', 'ATC', 'NEW_TUTOR_LJT@atc.ac.tz', 'tutor', '123', 'active'),
(801, 'Mrema, G/Lilian, L', 'ATC', 'Mrema@atc.ac.tz', 'tutor', '123', 'active'),
(802, 'tutor1', 'ATC', 'tutor1@atc.ac.tz', 'tutor', '123', 'active'),
(803, 'tutor2', 'ATC', 'tutor2@atc.ac.tz', 'tutor', '123', 'active'),
(804, 'tutor3', 'ATC', 'tutor3@atc.ac.tz', 'tutor', '123', 'active'),
(805, 'Mabondo', 'ATC', 'Mabondo@atc.ac.tz', 'tutor', '123', 'active'),
(806, 'Dr TAM, H', 'ATC', 'TAM@atc.ac.tz', 'tutor', '123', 'active'),
(807, 'BUNGARA, S', 'ATC', 'BUNGARA@atc.ac.tz', 'tutor', '123', 'active'),
(808, 'SADOCK, S', 'ATC', 'SADOCK@atc.ac.tz', 'tutor', '123', 'active'),
(809, 'KUTEGEZA, B', 'ATC', 'KUTEGEZA@atc.ac.tz', 'tutor', '123', 'active'),
(810, 'SHIRIMA, H', 'ATC', 'SHIRIMA@atc.ac.tz', 'tutor', '123', 'active'),
(811, 'Kawamala, M', 'ATC', 'Kawamala@atc.ac.tz', 'tutor', '123', 'active'),
(812, 'MECH STAFF', 'ATC', 'MECH_STAFF@atc.ac.tz', 'tutor', '123', 'active'),
(813, 'Dr. Kichonge, B', 'ATC', 'Kichonge@atc.ac.tz', 'tutor', '123', 'active'),
(814, 'Salla, P', 'ATC', 'Salla@atc.ac.tz', 'tutor', '123', 'active'),
(815, 'Mwamafu', 'ATC', 'Mwamafu@atc.ac.tz', 'tutor', '123', 'active'),
(816, 'Kihunrwa', 'ATC', 'Kihunrwa@atc.ac.tz', 'tutor', '123', 'active'),
(817, 'Mweteni, A', 'ATC', 'Mweteni@atc.ac.tz', 'tutor', '123', 'active'),
(818, 'Raymond, Y', 'ATC', 'Raymond@atc.ac.tz', 'tutor', '123', 'active'),
(819, 'Magania, F', 'ATC', 'Magania@atc.ac.tz', 'tutor', '123', 'active'),
(820, 'SALIJA', 'ATC', 'SALIJA@atc.ac.tz', 'tutor', '123', 'active'),
(821, 'Kundael', 'ATC', 'Kundael@atc.ac.tz', 'tutor', '123', 'active'),
(822, 'KURUTHUM', 'ATC', 'KURUTHUM@atc.ac.tz', 'tutor', '123', 'active'),
(823, 'Malisa', 'ATC', 'Malisa@atc.ac.tz', 'tutor', '123', 'active'),
(824, 'Dr Malembeka, F', 'ATC', 'Malembeka@atc.ac.tz', 'tutor', '123', 'active'),
(825, 'Kashimbiri, N', 'ATC', 'Kashimbiri@atc.ac.tz', 'tutor', '123', 'active'),
(826, 'Shomari, H', 'ATC', 'Shomari@atc.ac.tz', 'tutor', '123', 'active'),
(827, 'Matiko', 'ATC', 'Matiko@atc.ac.tz', 'tutor', '123', 'active'),
(828, 'LUSATO, K', 'ATC', 'LUSATO@atc.ac.tz', 'tutor', '123', 'active'),
(829, 'Ndidi, Z', 'ATC', 'Ndidi@atc.ac.tz', 'tutor', '123', 'active'),
(830, 'Kaswa', 'ATC', 'Kaswa@atc.ac.tz', 'tutor', '123', 'active'),
(831, 'BEATRICE', 'ATC', 'BEATRICE@atc.ac.tz', 'tutor', '123', 'active'),
(832, 'MWAYINGA, W/SADEMAKI, S', 'ATC', 'MWAYINGA1@atc.ac.tz', 'tutor', '123', 'active'),
(833, 'MBOWE, W', 'ATC', 'MBOWE@atc.ac.tz', 'tutor', '123', 'active'),
(834, 'RAMADHANI, I', 'ATC', 'RAMADHANI@atc.ac.tz', 'tutor', '123', 'active'),
(835, 'OSCAR, M', 'ATC', 'OSCAR@atc.ac.tz', 'tutor', '123', 'active'),
(836, 'FRANK', 'ATC', 'FRANK@atc.ac.tz', 'tutor', '123', 'active'),
(837, 'YONA, A', 'ATC', 'YONA@atc.ac.tz', 'tutor', '123', 'active'),
(838, 'MUNISHI, L', 'ATC', 'MUNISHI@atc.ac.tz', 'tutor', '123', 'active'),
(839, 'NYANZA', 'ATC', 'NYANZA@atc.ac.tz', 'tutor', '123', 'active'),
(840, 'Dr. CHAZEN, O', 'ATC', 'CHAZEN@atc.ac.tz', 'tutor', '123', 'active'),
(841, 'MATIKO, S/ NGOMA, A', 'ATC', 'MATIKO1@atc.ac.tz', 'tutor', '123', 'active'),
(842, 'SHOMARI, H/ NGOMA, A', 'ATC', 'SHOMARI1@atc.ac.tz', 'tutor', '123', 'active'),
(843, 'KAKALE, M', 'ATC', 'KAKALE@atc.ac.tz', 'tutor', '123', 'active'),
(844, 'MSUYA, E/ SEVERINO, S', 'ATC', 'MSUYA2@atc.ac.tz', 'tutor', '123', 'active'),
(845, 'ISSA, S/ CYLIACUS, S', 'ATC', 'ISSA2@atc.ac.tz', 'tutor', '123', 'active'),
(846, 'KUTEGEZA, B/ SEVERINO, S', 'ATC', 'KUTEGEZA1@atc.ac.tz', 'tutor', '123', 'active'),
(847, 'MASIKA/KASHIMBIRI/MAGANIA/SAWA', 'ATC', 'MASIKA1@atc.ac.tz', 'tutor', '123', 'active'),
(950, 'Peter B. Kaaya', 'ICT', 'peter@atc.com', 'tutor', '$2b$04$6939.3fq55r528os7AKKv.L1I0V1pu3GQAxM48I3x/TyRKYXAZcUK', 'ACTIVE'),
(951, 'Abdulkadir Kirobo', 'ICT', 'Abdulkadir@atc.tz', 'tutor', '$2b$04$Myeg4vk3Io5z2e0cjoP9deOUxxERebfrt5WHQYPKuOMGOlTMgLyH.', 'ACTIVE'),
(952, 'Ewald Mallya', 'ICT', 'Ewald@atc.ac.tz', 'tutor', '$2b$04$E4pcHH/fLSN2pz.JpuSvg.DiAR8omlUDpC8qK8tPFvs6xLpywz5AS', 'ACTIVE'),
(953, 'Fredy Amon', 'ICT', 'Fredy@atc.ac.tz', 'tutor', '$2b$04$nYtjmvIHAJIYMdDPdcHxY.S8W6R8z.f7qxk32vGN7k6qH5A3xUYSK', 'ACTIVE'),
(954, 'Peter Simalike', 'ICT', 'PeterSimalike@atc.ac.tz', 'tutor', '$2b$04$uHJDaPea7M3/z6Tqoo5MdO3Uh07.oSyI0ugCy0lqWc.TbQjHVs4oy', 'ACTIVE'),
(955, 'Adam B. Mtaho', 'ICT', 'Adam@atc.tz', 'tutor', '$2b$04$ba61seIfGbkwnY3hXfVBd.iCVz2wtstiAt2Fl5.uIqWs9FiJupkHm', 'ACTIVE'),
(956, 'Angela Kafuria', 'ICT', 'Angela@atc.ac.tz', 'tutor', '$2b$04$5Miek5kjjWvHsq4BNb6eR.AIH7CwIgjIzms.GdXBbs67Ojh36etn.', 'ACTIVE'),
(957, 'Baraka Mgala', 'ICT', 'Baraka@atc.ac.tz', 'tutor', '$2b$04$XG23Y77AJ1sgR1e5IvhoGui7f/IVprDhVwl8IbQcV1yrlSvvCox5O', 'ACTIVE'),
(958, 'Faraja January ', 'ICT', 'Faraja@atc.ac.tz', 'tutor', '$2b$04$z9U.4Rd6oKMmfLbvgW9/sO4Z1eCcffu/ggo1MvzYR9M4bKXzjAzC2', 'ACTIVE'),
(959, 'Japhet Kaijage', 'ICT', 'Japhet@atc.ac.tz', 'tutor', '$2b$04$i4TVIv47Yt2YZjsN2DEbDeHpXwWKHnMPkbsMESTYBTazhGxo2LS06', 'ACTIVE'),
(960, 'Castory Mkumba', 'Automotive', 'Castory@gmail.com', 'tutor', '$2b$04$tLXMI/DkQwb3C/5XiwrGUOUrS01v2XlZMuO9cM2oyX5nAZPZrr0a6', 'ACTIVE'),
(961, 'Dr. Peter Mashingo', 'Automotive', 'Mashingo@atc.ac.tz', 'tutor', '$2b$04$9MdvWtobBkPXCUuIFMO7.emAjgpf975rA6ybRcOpoGbg4SfEeTh8q', 'ACTIVE'),
(962, 'Ally Nuhu Kigundula', 'Automotive', 'Ally@atc.ac.tz', 'tutor', '$2b$04$kocxsD4o5.ZFSUYoLrdjmu6LRxGCE.R0LxAeOtyt6tfpQPRIqXL9G', 'ACTIVE'),
(963, 'Eng. Seba A. Maginga', 'Automotive', 'Seba@atc.ac.tz', 'tutor', '$2b$04$oFyKXa8Vgt55m5LqoXqbvOSsneVe8QtEbsMM9GKWMTUWmFpEk.vwq', 'ACTIVE'),
(964, 'Lagwen Dahaye', 'Automotive', 'Lagwen@atc.ac.tz', 'tutor', '$2b$04$dmergoBviKFPVrRQ33L8l.q.jIAv9vxcRoXTlduY4Tb8ItJ9Co0US', 'ACTIVE'),
(965, 'Andrea Francis Shayo', 'Automotive', 'Andrea@atc.ac.tz', 'tutor', '$2b$04$qJj8wb.0DyUn4o8WsAxfWu2sQZfsM1jy4iKuU7wJ4ZpFTmHcfdkge', 'ACTIVE'),
(966, 'Bisher Abdallah', 'Automotive', 'Bisher@atc.ac.tz', 'tutor', '$2b$04$qAy7pgNzomjQLmJc09bXHOR1vFdTU6fKwvrrCsrSJPaiViSTmVu0K', 'ACTIVE'),
(967, 'Benjamin Wanjara', 'Automotive', 'Benjamin@atc.ac.tz', 'tutor', '$2b$04$60AGlJcBYXBrO4p1/aGhYuQ2rozSgOPi3gABpqBHMPou5cFrPq/v.', 'ACTIVE'),
(968, 'Daudi Flavian', 'ICT', 'flavian@atc.ac.tz', 'tutor', '$2b$04$OCGey51z0dCt4gZlFA.0Ae8aaaMMgtiU8Twe6RDHR16tZtrRCfl4S', 'ACTIVE'),
(969, 'Eliya Msangazi', 'Automotive', 'Eliya@atc.ac.tz', 'tutor', '$2b$04$eSOdSIK/WXhOv/trBDJYVuPducK4Oc.DRDN8YEHh1dJGSAhvcxJoq', 'ACTIVE'),
(970, 'Jolvin Sylivester', 'Automotive', 'Jolvin@atc.ac.tz', 'tutor', '$2b$04$ABVQoDG9hOkkO1fnkEn02uR6OIIJOgdh54DXp11ZUuWZkp6ceAv3u', 'ACTIVE'),
(971, 'Yona A. Godson', 'civil', 'godson@atc.ac.tz', 'tutor', '$2b$04$d6zL0DpBKZO9v0oGyQZOIOV.0K6i6jLRVuD7b0LgZzRpeMhnghOfS', 'ACTIVE'),
(972, 'Elineema Msuya', 'civil', 'elineema@atc.ac.tz', 'tutor', '$2b$04$TrNqRjUGOKFk.FU2EEQpX.WPXWYWpFvUJUw5HaMAHt66easK8S73K', 'ACTIVE'),
(973, ' Eng. David Mtunguj', 'Automotive', 'Davidmtungi@atc.ac.tz', 'tutor', '$2b$04$qptqvw.Z1I9LTbf40er3tesR/vYZAWD/TodfN.Zx1RPG1JkGU6.A.', 'ACTIVE'),
(974, 'Allan Ngoma', 'civil', 'allan@atc.ac.tz', 'tutor', '$2b$04$BW0OwrGVwt7XwDbxdD/LnukSdf361FgoxaYO4EeDHQJjzgpLiTQLC', 'ACTIVE'),
(975, 'Ammon Mazengo', 'civil', 'ammon@atc.ac.tz', 'tutor', '$2b$04$7cPwWlbiKCNlaH31UwfHzeFciX2DMwkC4GWtAv.0uXafRAaduT/5G', 'ACTIVE'),
(976, 'Dr. Naisujaki Lymo', 'DASS', 'Naisujaki@atc.ac.tz', 'tutor', '$2b$04$94gZKNhMu8B2kaLlLPaX/..bZNldqIl3T2A5xMSRjFfZHOC/3bdve', 'ACTIVE'),
(977, 'CRN Charles Raphael', 'DASS', 'CRN@atc.ac.tz', 'tutor', '$2b$04$icUO0NOgyC0B7OYf8mmW6e00aaJqkJVUUocZxw6GnemPioZnA58N.', 'ACTIVE'),
(978, 'John R. Idelya', 'civil', 'idelya@atc.ac.tz', 'tutor', '$2b$04$xqNpI7ElfPApsh3jZfLjS.o8WH/88vgIN30aeV5vj67kR4r678hgC', 'ACTIVE'),
(979, 'Joseph Mruma', 'civil', 'mruma@atc.ac.tz', 'tutor', '$2b$04$zJSRKBQCETKQ2N0e4quXTOYeQBY4FmnEQgK4JimSp7wy/dj/WPKJS', 'ACTIVE'),
(980, 'Abdulazaki R. Mbekomize', 'DASS', 'Abdulazaki@atc.ac.tz', 'tutor', '$2b$04$nKhJls62tboOjb1YCKlMtOk7dXjACihe0Z7asa/lxcAeRBSAMJMNC', 'ACTIVE'),
(981, 'Lucas Mjengi', 'civil', 'mjengi@atc.ac.tz', 'tutor', '$2b$04$0iitFhw7cZow2.gahD8A/.h8DPwJW37ws1gEpQzN.sPKxRbwCuwDe', 'ACTIVE'),
(982, 'Oscar Msamba', 'DASS', 'Oscarmsamba@atc.ac.tz', 'tutor', '$2b$04$hvgFN5LrGxaFH59Q5YH9suqQrhGs55HOMKvB94crdutzSfOndfa2S', 'ACTIVE'),
(983, 'Rogate Kundaeli', 'civil', 'kundaeli@atc.ac.tz', 'tutor', '$2b$04$nzSZUdDgJv3IQ3L/keSfKu5IHCpxT.Tw6qybqdyvLx3wRo12NEFp6', 'ACTIVE'),
(984, 'Rehemael Anae', 'DASS', 'Rehemael@atc.ac.tz', 'tutor', '$2b$04$R0VHVCSip10BFwSbvOwPmO1GprATYwo4KgRq/Zq75sKv1eFtBck6O', 'ACTIVE'),
(985, 'Rehemael Anae', 'DASS', 'Rehemaelanae@atc.ac.tz', 'tutor', '$2b$04$iG3f3ek9ktc1tY7ZY2W93OJsvISEKnHeKyEfCz6FikMqJpkrbzkGy', 'ACTIVE'),
(986, 'Exavery P. Enock', 'DASS', 'Exavery@atc.ac.tz', 'tutor', '$2b$04$VSyGHPP29LdgKrNfFUvEEOTHLQtM3czDphdOwYUSj6O/yHOrj3KLi', 'ACTIVE'),
(987, 'Dr. Christine Mwenisongole', 'DASS', 'Christine@atc.ac.tz', 'tutor', '$2b$04$koaMVpbUqbMseFhJcg5nQudGNI8MwRngXagnWIVzslGX9svxvNiBi', 'ACTIVE'),
(988, 'Busumabu B. Jacob', 'DASS', 'Busumabujacob@atc.ac.tz', 'tutor', '$2b$04$5M.GEStWd4YF0WppfhagxO6yFW5dsb4q75mnjMYeVHR665AJ5rK.G', 'ACTIVE'),
(989, 'Said I. Shaushi', 'civil', 'shaushi@atc.ac.tz', 'tutor', '$2b$04$Ywm/QZEljPMkZsO2ADlvt.6fZjzlhHJ8Qbi/6/f9Z1KjK5eFUwbym', 'ACTIVE'),
(990, 'Gasper M. Wilfre', 'DASS', 'Gasper@atc.ac.tz', 'tutor', '$2b$04$6bb1eImUGkRSLYQ4CDgXeuGHraq3cvxYdjN47iggvPF1OrqPnn1Ay', 'ACTIVE'),
(991, 'Said H. Bungara', 'civil', 'hbungara@atc.ac.tz', 'tutor', '$2b$04$Ea3WGwtJnF0STSJS5FZtKuW68YhGAmNMrlQcQ5DzSV3od8i6wtjY6', 'ACTIVE'),
(992, 'Dr. U. E. Msovu', 'civil', 'msovu@atc.ac.tz', 'tutor', '$2b$04$fXzdeBILpn7BdngHkZ1duOR7cIqKdGwA6c91s7TcTlYTLEjaXDuAy', 'ACTIVE'),
(993, 'Gasper M. Wilfred', 'DASS', 'Gasperwilfred@atc.ac.tz', 'tutor', '$2b$04$kV6fHd04qC8BWcSJG55CIeSbAJVTkXzw2cHHEGmCFaWTpXBFZbW82', 'ACTIVE'),
(994, 'Eng. Faraji Magania', 'civil', 'fmagania@atc.ac.tz', 'tutor', '$2b$04$pd872kGhggnj1K/R6vyPNuj6ksr6cp4gMaApPcQSj0qcIEzahowZm', 'ACTIVE'),
(995, 'Joyce Temu', 'DASS', 'Joyce@atc.ac.tz', 'tutor', '$2b$04$dXAzFq7hde8DpEV9d7tjkehqYheyfFVJXrwVdBYx8TDo7IyVIVDF2', 'ACTIVE'),
(996, 'Sarah Alex Katepa', 'civil', 'skatepa@atc.ac.tz', 'tutor', '$2b$04$1ZCEV2yTT5Y0PpKvD1QsBuLEnaEiqfBbjGUI4gQiSU6IgE8KW4C/a', 'ACTIVE'),
(997, 'Tunzoeli E. Ikaho', 'DASS', 'Tunzoeli@atc.ac.tz', 'tutor', '$2b$04$U0W70xETBeBmhjOjvhr64.2a/FdchO76oAnOZT/Z8HUghuc9xWGoe', 'ACTIVE'),
(998, 'Zawadiel Steven Kundael', 'civil', 'skundael@atc.ac.tz', 'tutor', '$2b$04$FpMRtWtdZ24c4KEOTe.G8.YvKO.o4//uIueuiyLIhUHowDy7x2aU6', 'ACTIVE'),
(999, 'Labani Kanyonga', 'DASS', 'Labani@atc.ac.tz', 'tutor', '$2b$04$GSOUGyICx7W/PWPILFWrfOqu/aqisOO4bc8kQc8fEdWCwNT.2.fsO', 'ACTIVE'),
(1000, 'Ally Ngulugulu ', 'Electrical', 'ngulugulually@atc.ac.tz', 'tutor', '$2b$04$4cFVotXnVJQ57PonT1SyGulu7xGq8CzPok4ZqZ.1w64fDXcXellgG', 'ACTIVE'),
(1001, 'Rose Sadiki', 'Electrical', 'sadikir@atc.ac.tz', 'tutor', '$2b$04$g01ZnJtc9DvY.EZQmJH6DOzq/Dcq/hn6Ar97kw8Hp07hKgEJ1qntO', 'ACTIVE'),
(1002, 'Dr. Godfrey G. Moshi', 'Electrical', 'moshigod@atc.ac.tz', 'tutor', '$2b$04$aPpyA1fVAkEgC43oOHM2buotGEEycW.AXLnUoX.BQG22y3MXL6bn6', 'ACTIVE'),
(1003, ' Urbanus F. Melkior', 'Electrical', 'urbanus@atc.ac.tz', 'tutor', '$2b$04$RLM5RlDNblwDKIghjsQm2escWEn1ZgjcCOuGZ.oiAuA1e8hnOoF4u', 'ACTIVE'),
(1004, 'Dr. Baraka Kichonge', 'Mechanical ', 'Barakakichonge@atc.ac.tz', 'tutor', '$2b$04$auko/vnH18BCQtbvOjTmT.RSz8UGN8hergSX6/6kAwn1DsjQWgTeO', 'ACTIVE'),
(1005, 'Eng. Sithole E. Mwakatage', 'Electrical', 'mwakatagesithole@atc.ac.tz', 'tutor', '$2b$04$X1NCcEObOu.7J1zWchDx9OuaQ5K5LJ/Gc6Ts2Qn5pV8QrczmXlCtu', 'ACTIVE'),
(1006, 'Jafari Mwanza', 'Mechanical ', 'Jafari@atc.ac.tz', 'tutor', '$2b$04$qE9Oy.j7fX3YnVHPKPsUCOvgxpDelTh0Xra0XircISVxGIXKFQAS2', 'ACTIVE'),
(1007, 'Emanuel Kassi', 'Electrical', 'kassie@atc.ac.tz', 'tutor', '$2b$04$VYpT2kXQE8RWa3Com7dXDuf7zn0I1.bd0FrjWbAaaLDUY7YdZskoq', 'ACTIVE'),
(1008, ' Daniel D. Mawa', 'Electrical', 'dmawa@atc.ac.tz', 'tutor', '$2b$04$jNXJk2jhyNUeF2yRNm31leQ1QD3HhgCy8SFUkI.yXzmk5ZjnjNBf.', 'ACTIVE'),
(1009, 'Dr. Daniel H. Ngoma', 'Mechanical ', 'Danielngoma@atc.ac.tz', 'tutor', '$2b$04$214sFqMqRUYge4KXHjZd7upXtG.5Yg3fWts92/YofPBiLQDjKGqcO', 'ACTIVE'),
(1010, 'Daniel Wilson', 'Electrical', 'wilsond@atc.ac.tz', 'tutor', '$2b$04$ddRbXFW6k9ajVVWnep9cdOmfArm9eO/66IBNXXDSRWQuaepW0BRui', 'ACTIVE'),
(1011, 'Baneti Masenga', 'Mechanical ', 'Baneti@atc.ac.tz', 'tutor', '$2b$04$rg/JOOytUazN8WscaPElcuk9WF47Re.w///cmnocKERP9qUFEdoOm', 'ACTIVE'),
(1012, 'Fadhili P.Malisa', 'Electrical', 'fmalisa@atc.ac.tz', 'tutor', '$2b$04$3n3b/lB8gVnkzRcftE6Oy.E.VBi81cUNRox3pqclE7YjqFmAUqSre', 'ACTIVE'),
(1013, 'Elisha Mbise', 'Mechanical ', 'Elishambise@atc.ac.tz', 'tutor', '$2b$04$odNE5FapxF0Tm6gCNwbjiOBanPVqYu6fXPwzs.0t/Mh501f119WKa', 'ACTIVE'),
(1014, 'Isack Nkola', 'Electrical', 'nkola@atc.ac.tz', 'tutor', '$2b$04$O6GJQOcYH5msHfhEy85P6O.QWWr15QeBL0cHGiJdAlkpf/3fPCHb2', 'ACTIVE'),
(1015, 'Gilion Mgaya', 'Mechanical ', 'Gilionmgaya@atc.ac.tz', 'tutor', '$2b$04$Z.jrOEM2hvJoije90Jhj9uskEQkjlahq5vxCuw1Bzf5QYllTGsM7.', 'ACTIVE'),
(1016, 'Lufunyo B. Lupenza', 'Electrical', 'lufunyolupenza@atc.ac.tz', 'tutor', '$2b$04$aT3afKkSv/3EJHkLQxxlO.Y7O1323VlfVm1tHYY9/34/wQ8x//tlO', 'ACTIVE'),
(1017, 'John N. James ', 'Mechanical ', 'Johnjames@atc.ac.tz', 'tutor', '$2b$04$9i55V7DrEcimkJtptUROiuYhN.gSGRTX6U3m1jX0y4N/z1vj/ULom', 'ACTIVE'),
(1018, 'Marco P. Mwaimu', 'Electrical', 'pmwaimu@atc.ac.tz', 'tutor', '$2b$04$GjpOdBNpB4c0eti70PXCoeGyzCZJyldfhd8RWPt3hylrtd21vIRE2', 'ACTIVE'),
(1019, 'Mengi Mkina', 'Electrical', 'mm@atc.ac.tz', 'tutor', '$2b$04$08BQrTxMlT1TFZO8.ySHA.NbwOr1thCIvuwhWV2ido1x5JH1i.OYG', 'ACTIVE'),
(1020, 'Makula Nangale', 'Mechanical ', 'Nakulanangale@atc.ac.tz', 'tutor', '$2b$04$/ah9D2kBw7zway4V41E4Tur5ytWesbDnShuXAKwTnWlG1MSN3SDJK', 'ACTIVE'),
(1021, 'Rashid Mkacha', 'Mechanical ', 'Rashidmkacha@atc.ac.tz', 'tutor', '$2b$04$kNk2zwhO1KoGfGWpJ8Jom.PHBgZ0MjvHvWIJtMAVmC78jOXfogKJ2', 'ACTIVE'),
(1022, 'Nicodemus M. Mbwambo', 'Electrical', 'mbwambo@atc.ac.tz', 'tutor', '$2b$04$QHXSdscG5egpWbZMIMYyTuy31hoHBTm4bsvsrosC0K9op7WvB/lP.', 'ACTIVE'),
(1023, ' Roland L. Horombo', 'Electrical', 'horombo@atc.ac.tz', 'tutor', '$2b$04$ks.eKec/Z8Rwavcxb3F6luEdJH5j.D95RZvXhTzmOFFWcFgdwZzwy', 'ACTIVE'),
(1024, 'Adam F. Mfangavo', 'Mechanical ', 'Adammfangavo@atc.ac.tz', 'tutor', '$2b$04$LzYVMzmFd6qcWrJzznfJUex/2M1PtExnTdyzpZ2KIKUhsxONJyIbm', 'ACTIVE'),
(1025, 'Williard M. Mwayinga', 'Electrical', 'wmwayinga@atc.ac.tz', 'tutor', '$2b$04$gDn1wfJg30k9yW8YV3CtMuifBE7/uxEzZdXiX99BdcI/w83lKhcTO', 'ACTIVE'),
(1026, 'Samson Abel Mwakapoma', 'Electrical', 'smwakapoma@atc.ac.tz', 'tutor', '$2b$04$2lpY4elmQnJb3bLQI5hCLO/h51mCbktbuWb/yxH6717df.Y4w0156', 'ACTIVE'),
(1027, 'Josephat L. Fabian', 'Mechanical ', 'Josephatfabian@atc.ac.tz', 'tutor', '$2b$04$GkVai5hgvv.NL034YCPvLOEB0HDGHxIHsViO3A5B9Fvi8sEeqoC9e', 'ACTIVE'),
(1028, 'Dotto C. Joseph', 'Transportation', 'josephdotto@atc.ac.tz', 'tutor', '$2b$04$IgbpQG1/RVVB1gi17Kbbm.VOenm9yhzB9tHC/A5ZLmRlzzDVscenS', 'ACTIVE'),
(1029, 'Ali S. Hassan', 'Mechanical ', 'Alihassan@atc.ac.tz', 'tutor', '$2b$04$DjbCj2PvOjNWOr3S6Oo9fuDOP5HLFgGYJ4/b72BJOClVabWhDdihq', 'ACTIVE'),
(1030, 'Eng. Herieth Uiso', 'Transportation', 'uiso@atc.ac.tz', 'tutor', '$2b$04$.fvYuM2HQdMA1ABQbRgL5eVPsY0sgOFxlS9MRMIlpnu3Wt6S7lWxa', 'ACTIVE'),
(1031, ' Frank Lucas Mjebe', 'Transportation', 'mjebe@atc.ac.tz', 'tutor', '$2b$04$JIoWAXm9Bvx9U8ROt3Jn6uhwhjpEe8sPYGU/SXKdPeFrNpmNWE6Ui', 'ACTIVE'),
(1032, 'Elina Caroly', 'Mechanical ', 'Elinacaroly@atc.ac.tz', 'tutor', '$2b$04$XOFbGhjnDkHOgMsRzrfDW.2s1xxlOKObAowbjvmnbgiUS.IRuRRcu', 'ACTIVE'),
(1033, ' Siliacus Salvatory Kayungi', 'Transportation', 'kayungi@atc.actz', 'tutor', '$2b$04$yw3m3WS228OulxNyolY5W.BQYpJYBRSS.UV6GhGrQ.x6H5YaXUAiC', 'ACTIVE'),
(1034, 'Frank Moshi', 'Mechanical ', 'Frankmoshi@atc.ac.tz', 'tutor', '$2b$04$B8p163tmH5yU6M4SMLw7nOeivm1Z/KVSsZroH8H.6AGm.J9BZOHMK', 'ACTIVE'),
(1035, 'Eng. Seba A. Maginga', 'VET', 'magingaseba@atc.ac.tz', 'tutor', '$2b$04$fp3yK.K7.KIq1xfRX2lOu.vuj8OVRY0MagrF4q5InIzNEQzKYwJuW', 'ACTIVE'),
(1036, 'Hamdan S. Magesa', 'Mechanical ', 'Hamdanmagesa@atc.ac.tz', 'tutor', '$2b$04$bVKgxRadySKSmWA1H7dzQO24maB.Fkskw6RoXV2oly0Cfd0PGkOS.', 'ACTIVE'),
(1037, 'Jumbe Omari Jumbe', 'Mechanical ', 'Jumbe@atc.ac.tz', 'tutor', '$2b$04$6TL4/Y2FZXRM6n0ONYXEMuYUdNZCHR8nVTS2vyIbdK60X0h.Sgiom', 'ACTIVE'),
(1038, 'Martin Kawamala', 'Mechanical ', 'Martinkawamala@atc.ac.tz', 'tutor', '$2b$04$PyKomPA/oAGo81XBlKwK.eIfuZxGzCSdYARBfUA5brLrdZG8hrVH2', 'ACTIVE'),
(1039, 'Dr. Jafari Mwanza', 'Mechanical ', 'Jafarimwanza@atc.ct.tz', 'tutor', '$2b$04$OpkQsCVapq2U0yCuwxyckeY3W/6NjmZ92Qpke0qZHkz.qzLPWUoeq', 'ACTIVE'),
(1040, 'MASOUD MBELWA', 'ELECTRICAL', 'masoud@atc.ac.tz', 'tutor', '$2b$04$HFYwPXObEPEApWRExvLPduKaDHKDWq9JVhJHRIW4lT02/6TnMxrhy', 'ACTIVE'),
(1041, 'MOSES MWASAGA', 'ICT', 'moses@atc.ac.tz', 'tutor', '$2b$04$uheYn8t0b29IhFm5yJTo.eh6KAVXQ7VGxizYVevuiomGNe9IkXBY6', 'ACTIVE'),
(1042, 'BENARD MANYAHI', 'ICT', 'benard@atc.ac.tz', 'tutor', '$2b$04$kbicuu.nGJ74PKMiVsFVbu/xxWi8KS0U.3S4YDqJPtBRE3XtvJ4a2', 'ACTIVE'),
(1043, 'DANIEL MEDSON', 'ICT', 'danielmedson@atc.ac.tz', 'tutor', '$2b$04$hrTNFf1fY0u6vu3noSfS3eZqBeoU97T5D.DRvjicoeUR0mpUGEA7O', 'ACTIVE'),
(1044, 'NAINSUJACK LIMO', 'DASS', 'Naisujack@atc.ac.tz', 'tutor', '$2b$04$YwCCVMF/qtcKeYkRSvuug.TkJnp2nhRMWSoj2lsWpqOfhtvMhT3F2', 'ACTIVE'),
(1045, 'RAJABU MOSHI', 'ICT', 'rajabu@atc.ac.tz', 'tutor', '$2b$04$fjWR2bgxuiZm3Q2MsLzw2OQn.E2TPIFOB2KrI4H7f061LpSHpaBtG', 'ACTIVE'),
(1046, 'Dr.Kefa', 'ELECTRICAL', 'kefa@atc.ac.tz', 'tutor', '$2b$04$g.R0WCuaFHe/pXc7zVuUB.ZPOixBmoH7ULc/sGxsMMON9sGq0dSYq', 'active'),
(1047, 'Dr.Mzava', 'ELECTRICAL', 'mzava@atc.ac.tz', 'tutor', '$2b$04$YW3CT/hIGH8dqfaGTUIaT.qLQIaeHjA4iSVuGgH07MABP.cx2cta.', 'active'),
(1048, 'Ms.Lilian Lyatuu', 'ELECTRICAL', 'lilian@atc.ac.tz', 'tutor', '$2b$04$N5W1fDI0P6rGB.ft.td57e4ctC8/idQIeBP3DNnyM8ZuWOKfcTLXi', 'active'),
(1049, 'Mr.Samwel Stewart', 'ELECTRICAL', 'stewart@atc.ac.tz', 'tutor', '$2b$04$i3k9SYY9DTcSRhOeV1MODebAtPE07Nf1OJRgmCtfabWRJZ588eIHC', 'active'),
(1050, 'Mr.Majura', 'ELECTRICAL', 'majura@atc.ac.tz', 'tutor', '$2b$04$rzlAC3cx4UYn44or2AOMpukO2XX0xLK.xCcwJgUBRCiSb3VzQOsLu', 'active'),
(1051, 'Mr.Daniel Mayala', 'ELECTRICAL', 'mayala@atc.ac.tz', 'tutor', '$2b$04$ITSBy.NqVBCE/6bM6DOpZ.Rew46/Ovp5BUwAaNzCl8Do6ExlD8YMq', 'active'),
(1052, 'Mr.Sembuli', 'ELECTRICAL', 'sembuli@atc.ac.tz', 'tutor', '$2b$04$wbo7QXdRw4a.W/OZpYDZ2O4u0lYAkRiYD0Vf2264OxsdCntY.FVlm', 'active'),
(1053, 'Mr.Nsulwa', 'DASS', 'nsulwa@atc.ac.tz', 'tutor', '$2b$04$AkSO//hZhidG.Jp/RYw9DeFnuG0EVoxp4/NhA9mRYHvnt5SgUBV/y', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `venues`
--

CREATE TABLE `venues` (
  `venue_id` int(11) NOT NULL,
  `venue_name` varchar(255) DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 0,
  `location` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `quality` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `mnos` int(11) NOT NULL DEFAULT 1,
  `tnos` int(11) NOT NULL DEFAULT 1,
  `wnos` int(11) NOT NULL DEFAULT 1,
  `thnos` int(11) NOT NULL DEFAULT 1,
  `frnos` int(11) NOT NULL DEFAULT 1,
  `satnos` int(11) NOT NULL DEFAULT 1,
  `sunnos` int(11) NOT NULL DEFAULT 1,
  `totalnos` int(11) NOT NULL DEFAULT 7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `venues`
--

INSERT INTO `venues` (`venue_id`, `venue_name`, `capacity`, `location`, `type`, `quality`, `department`, `status`, `mnos`, `tnos`, `wnos`, `thnos`, `frnos`, `satnos`, `sunnos`, `totalnos`) VALUES
(11, 'ALGO LAB', 20, 'ATC', 'Lab', 'good', 'ICT', 'Available', 3, 1, 1, 1, 1, 1, 1, 12),
(12, 'AUTOMATION LAB', 15, 'ATC', 'Lab', 'good', 'Automotive', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(13, 'BIOMEDICAL LAB ', 40, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(14, 'Comp R22/23', 100, 'ATC', 'Lab', 'good', 'ICT', 'Available', 2, 1, 1, 1, 1, 1, 1, 9),
(15, 'Comp R31 ', 30, 'ATC', 'Lab', 'good', 'ICT', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(17, 'Comp R32/33', 100, 'ATC', 'Lab', 'good', 'ICT', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(18, 'DINNING HALL', 200, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(19, 'DRAWING ROOM', 60, 'ATC', 'Lab', 'good', 'civil', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(20, 'EBR-1', 80, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(21, 'F-06/07', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 2, 1, 1, 1, 1, 1, 1, 9),
(22, 'F-12', 110, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(23, 'G-11', 110, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(24, 'HIGHWAY', 120, 'ATC', 'Theory', 'good', 'civil', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(25, 'HYDRAULICS LAB', 60, 'ATC', 'Lab', 'good', 'Automotive', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(27, 'LAB 3', 18, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 2, 1, 1, 1, 1, 1, 1, 9),
(28, 'LAB 4', 40, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(29, 'LAB LST (CHEM)', 80, 'ATC', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(30, 'LAB LST (PHY)', 80, 'ATC', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(31, 'LAB LST BIOL', 80, 'ATC', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(32, 'LAB WQ2-F13', 60, 'ATC-Irrigation', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(33, 'LANGUAGE LAB', 60, 'ATC', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(34, 'M/W I & II', 60, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(35, 'M2A W/S', 30, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(36, 'M2B W/S', 30, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(37, 'M2C W/S', 30, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(38, 'MASONRY', 54, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(39, 'ROOM 06', 100, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(40, 'Room 11', 72, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(41, 'Room 12/13', 180, 'ATC', 'Theory', 'good', 'neutral', 'Available', 2, 1, 1, 1, 1, 1, 1, 9),
(42, 'Room 14', 72, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(43, 'Room 24', 72, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(44, 'Room 34', 60, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(45, 'Room 42 - LAB', 60, 'ATC', 'Lab', 'good', 'ICT', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(46, 'Room 44', 60, 'ATC', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(47, 'S-06', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(48, 'S-07', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(49, 'S-10', 110, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(50, 'S-12', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(51, 'SOIL LAB', 30, 'ATC-Irrigation', 'Lab', 'good', 'DASS', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(52, 'Solar/Wind', 50, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(53, 'T-10', 110, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(54, 'T-11', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(55, 'T-12', 60, 'ATC-Irrigation', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(56, 'TRANSPORT', 30, 'ATC', 'Lab', 'good', 'Transportation', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(57, 'UF-01', 114, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(58, 'UF-05', 125, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(59, 'UG-06', 130, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(60, 'UG-07', 130, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(61, 'US-01', 80, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(62, 'US-02', 114, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(63, 'UT-01', 80, 'ATC-Ufundi tower', 'Theory', 'good', 'neutral', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(64, 'W/ LJT LAB1', 20, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(65, 'W/LJT ', 20, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(66, 'W/S AUTO', 40, 'ATC', 'Lab', 'good', 'Automotive', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(67, 'W/S AUTO 2', 60, 'ATC', 'Lab', 'good', 'Automotive', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(68, 'W/S CARP', 30, 'ATC', 'Lab', 'good', 'VET', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(69, 'W/S CIVIL', 40, 'ATC', 'Lab', 'good', 'civil', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(70, 'W/S E', 30, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(71, 'W/S E2', 40, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(72, 'W/S ME 1', 30, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(73, 'W/S ME 2', 30, 'ATC', 'Lab', 'good', 'Mechanical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7),
(74, 'W/S E1', 20, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 2, 1, 1, 1, 1, 1, 1, 9),
(76, 'WS EL/WS MECH/W', 100, 'ATC', 'Lab', 'good', 'Electrical', 'Available', 1, 1, 1, 1, 1, 1, 1, 7);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `extracted_timetables`
--
ALTER TABLE `extracted_timetables`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`program_id`),
  ADD UNIQUE KEY `program_code` (`program_code`),
  ADD KEY `name` (`program_name`),
  ADD KEY `level` (`level`);

--
-- Indexes for table `registered_subjects`
--
ALTER TABLE `registered_subjects`
  ADD PRIMARY KEY (`registered_subject_id`),
  ADD UNIQUE KEY `registered_subject_code` (`registered_subject_code`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD KEY `program_id` (`program_id`),
  ADD KEY `title` (`title`),
  ADD KEY `program_id_2` (`program_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_email` (`user_email`),
  ADD KEY `full_name` (`full_name`),
  ADD KEY `role` (`role`);

--
-- Indexes for table `venues`
--
ALTER TABLE `venues`
  ADD PRIMARY KEY (`venue_id`),
  ADD KEY `type` (`type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `extracted_timetables`
--
ALTER TABLE `extracted_timetables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `program_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `registered_subjects`
--
ALTER TABLE `registered_subjects`
  MODIFY `registered_subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=497;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1054;

--
-- AUTO_INCREMENT for table `venues`
--
ALTER TABLE `venues`
  MODIFY `venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
