-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 04, 2023 at 11:50 PM
-- Server version: 10.6.16-MariaDB
-- PHP Version: 8.1.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ferozaac_clinique-account-management`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(12) NOT NULL,
  `password` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `username`, `password`) VALUES
(2, 'Ashfaq', 'ash', '$2b$10$6OuP7xnQPn.5bSd4.SsxvugrBu034RtBx8Sj/xmn1/VXioOBsJES6'),
(6, 'Amina Khan', 'amina', '$2b$10$kAQzntPyMA4JfZF4PQn4DOTQ2txaquIz7tYjXwB92q2d/dNUs8YD2'),
(7, 'Maruf', 'maruf', '$2b$10$0b9tLimO0qGs3i5S2QT0wuGhgN5.TKlX4V/wTPEdIvzth07d1byu6'),
(8, 'Zayed Khan', 'zayed', '$2b$10$pGbQt257Qwy1WFIfpu0tAOInMkvXM49xytFVnUPPmrxmTWQM5g2Mi');

-- --------------------------------------------------------

--
-- Table structure for table `expenditure`
--

CREATE TABLE `expenditure` (
  `id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `image_name` varchar(255) NOT NULL,
  `operator` varchar(55) NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operator`
--

CREATE TABLE `operator` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(12) NOT NULL,
  `password` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operator`
--

INSERT INTO `operator` (`id`, `name`, `username`, `password`) VALUES
(7, 'Rakibul Hasan', 'rakib', '$2b$10$5H5OTiSIWJlA60.L6lm8ue1pUrI6y4MXHNhuyvtMxnBPXDCQmJ/b.'),
(8, 'Rotna Akther Koli', 'koli', '$2b$10$BOHAgMmL6E9PWR9vBewSl.vL8vWigbqacf9l0ooqgikF5oSuGn.6S'),
(9, 'Maruf', 'maruf', '$2b$10$J0vdldG3mZ4f3DEX49CI2uepiMHz.D4vBvpUWpxXei8uvr7fwhida'),
(10, 'Mohammad Arshadullah', 'arshadullah', '$2b$10$4Exo23jFSohIgZk6ps4IueQIbrfWCNdQloGFVUKj9rgs.jzPofJfm');

-- --------------------------------------------------------

--
-- Table structure for table `otherincome`
--

CREATE TABLE `otherincome` (
  `id` int(11) NOT NULL,
  `incomeType` varchar(255) NOT NULL,
  `income` decimal(10,2) NOT NULL,
  `date` datetime NOT NULL,
  `operator` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `fname` varchar(255) NOT NULL,
  `age` int(3) NOT NULL,
  `address` varchar(100) NOT NULL,
  `contact` varchar(15) NOT NULL,
  `doctor` varchar(100) NOT NULL,
  `department` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `otCharge` decimal(10,2) NOT NULL,
  `otType` varchar(100) NOT NULL,
  `serviceCharge` decimal(10,2) NOT NULL,
  `admissionFee` decimal(10,2) NOT NULL,
  `pathologyCost` decimal(10,2) NOT NULL,
  `totalPaid` decimal(10,2) NOT NULL,
  `dueAmount` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `doctorCharge` decimal(10,2) NOT NULL,
  `seatNumber` int(5) NOT NULL,
  `seatRent` decimal(10,2) NOT NULL,
  `totalCharge` decimal(10,2) NOT NULL,
  `operator` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient`
--

INSERT INTO `patient` (`id`, `name`, `fname`, `age`, `address`, `contact`, `doctor`, `department`, `date`, `otCharge`, `otType`, `serviceCharge`, `admissionFee`, `pathologyCost`, `totalPaid`, `dueAmount`, `discount`, `doctorCharge`, `seatNumber`, `seatRent`, `totalCharge`, `operator`) VALUES
(36, 'Mrs. Kohinur', '', 45, '', '01635349968', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 08:21:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'koli'),
(37, 'Jalal Uddin', '', 30, '', '01732906604', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 08:24:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'koli'),
(38, 'Surjahan', '', 25, '', '01771786255', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 08:24:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'koli'),
(39, 'Mifta', '', 9, '', '01612292968', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 08:24:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'koli'),
(40, 'Ratna Akter', '', 20, '', '01911879250', 'Prof. Dr. Sufia Khatun', '', '2023-12-02 20:53:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'rakib'),
(41, 'Shornika  Chokroborty', '', 24, '', '01636956414', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 21:50:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'rakib'),
(42, 'Saiful Islam', '', 48, '', '01762418485', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 21:50:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'rakib'),
(43, 'Safia ', '', 47, '', '01761892818', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-02 21:50:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'rakib'),
(44, 'shourove khatun', '', 27, '', '01308805420', 'Prof. Dr. Sufia Khatun', '', '2023-12-02 23:31:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 'arshadullah'),
(45, 'Test', 'Test Father', 25, 'Test Address', '01736436782', 'Prof. Dr. Sufia Khatun', '', '2023-12-03 13:55:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 209, 0.00, 0.00, 'arshadullah'),
(46, 'Mrs. Sheuly', 'Md. Mizanur Rahman', 40, 'Shahabchar, Hossainpur, Kishoreganj', '01798583100', 'Prof. Dr. Sufia Khatun', '', '2023-12-03 16:13:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 402, 0.00, 0.00, 'koli'),
(47, 'Rahima', 'Md. Shopon Mia', 40, 'Noyapara, Gaital, Kishoreganj Sadar', '01923758679', 'Prof. Dr. Sufia Khatun', '', '2023-12-03 19:04:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 205, 0.00, 0.00, 'rakib'),
(48, 'Renu Akter', 'Abdul Khalek', 50, 'Poschimpara, Katiadi, Kishoreganj', '01793072912', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-03 22:08:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 205, 0.00, 0.00, 'rakib'),
(49, 'Abdul Khalek', 'Md. Toiub Ali', 45, 'Hosendi, Pakundia, Kishoreganj', '01761442166', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-03 22:12:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 210, 0.00, 0.00, 'rakib'),
(50, 'Mohon Basi Das', 'Hemchondro Das', 50, 'Rajibpur, Mithamoin, Kishoreganj', '01316516898', 'Prof. Dr. Molla Nazrul Islam', '', '2023-12-03 22:14:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 211, 0.00, 0.00, 'rakib'),
(52, 'Juyel', 'Deluyar', 27, 'Kodomchal, Austragram, Kishoreganj', '01793072912', 'Prof. Dr. Molla Nazrul Islam', 'Surgery', '2023-12-04 21:17:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 211, 0.00, 0.00, 'rakib'),
(53, 'Nusrat Jahan Nijhum', 'Al-Amin Sheikh', 20, 'Pagla, Mymensingh', '01772735678', 'Prof. Dr. Sufia Khatun', 'Gynaecology', '2023-12-04 21:20:00', 1000.00, 'N.V.D', 1000.00, 300.00, 0.00, 5000.00, 0.00, 0.00, 2000.00, 205, 1000.00, 5000.00, 'rakib'),
(54, 'Suma', 'Sabbir Ahmed', 22, 'Lokkhiprasad, Poschim Jointapur, Sylhet', '01783006329', 'Prof. Dr. Sufia Khatun', 'Gynaecology', '2023-12-04 21:23:00', 0.00, '', 0.00, 300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2011, 0.00, 0.00, 'rakib');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenditure`
--
ALTER TABLE `expenditure`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `operator`
--
ALTER TABLE `operator`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otherincome`
--
ALTER TABLE `otherincome`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expenditure`
--
ALTER TABLE `expenditure`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `operator`
--
ALTER TABLE `operator`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `otherincome`
--
ALTER TABLE `otherincome`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
