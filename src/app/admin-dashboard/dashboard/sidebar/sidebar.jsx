"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Logout } from "@/app/Store/Slice";
import Image from "next/image";
import { FaFileInvoice } from "react-icons/fa6";
import { FiMenu } from "react-icons/fi";
import { FaListOl } from "react-icons/fa";
import { IoIosAddCircle } from "react-icons/io";
import { MdEmojiTransportation } from "react-icons/md";
import { FaCar } from "react-icons/fa";
import { GiCargoShip } from "react-icons/gi";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ExpandLess,
  ExpandMore,
  AnalyticsOutlined,
} from "@mui/icons-material";
import {
  FaUsers,
  FaUserTie,
  FaBoxOpen,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdHistory } from "react-icons/md";
import { PiBank } from "react-icons/pi";
import { Hotel } from "lucide-react";

// Styled Components
const SidebarContainer = styled(Drawer)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: 280,
    boxSizing: "border-box",
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const Sidebar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const userRole = useSelector((state) => state?.auth?.role) ?? "admin";

  const toggleDropdown = (key) => {
    setOpenDropdowns((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handleNavigation = (path) => {
    console.log(`Navigating to: ${path}`); // Debug log
    try {
      router.push(path);
    } catch (error) {
      console.error("Navigation failed:", error);
    }
  };

  const handleLogout = () => {
    console.log("Logging out..."); // Debug log
    dispatch(Logout());
    handleNavigation("/"); // Reuse handleNavigation for consistency
  };

  const menuItems = [
    {
      title: "Admin Management",
      path: "/admin-dashboard/admin-Management", // Matches folder name
      icon: <FaUsers />,
      roles: ["admin", "sub admin"],
    },
    // {
    //   title: "User's Management",
    //   path: "/admin-dashboard/agent-Management", // Reuse agent-Management for now
    //   icon: <FaUsers />,
    //   roles: ["admin", "sub admin"],
    // },
    {
      title: "Payments",
      icon: <FiMenu />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Payment", path: "/admin-dashboard/add-payment", icon: <Hotel />, roles: ["admin", "sub admin"] },
        { title: "Payment Requests", path: "/admin-dashboard/payment-management", icon: <Hotel />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Main Management",
      icon: <FiMenu />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "Sea Ports", path: "/admin-dashboard/sea-ports", icon: <Hotel />, roles: ["admin", "sub admin"] },
      ],
    },

    {
      title: "Customer Management",
      icon: <FiMenu />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "Customers", path: "/admin-dashboard/distributers", icon: <Hotel />, roles: ["admin", "sub admin"] },
        { title: "Ledger", path: "/admin-dashboard/distributers/trnxs", icon: <Hotel />, roles: ["admin", "sub admin"] },
      ],
    },


    {
      title: "Share Holders",
      icon: <FiMenu />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "Share Holders", path: "/admin-dashboard/shareholders", icon: <Hotel />, roles: ["admin", "sub admin"] },
        { title: "Ladger", path: "/admin-dashboard/shareholders/trnxs", icon: <Hotel />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Invoices",
      icon: <FaFileInvoice />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Invoice", path: "/admin-dashboard/invoice-form/newinvoice", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] }, // Adjust as needed
        { title: "Invoice's List", path: "/admin-dashboard/invoice-form", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      //   { title: "Incomplete Invoices", path: "/admin-dashboard/invoice-form", icon: <FaListOl />, roles: ["admin", "sub admin"] }, // Add subfolder if needed
       ],
    },
    {
      title: "Vehicle Management",
      path: "/admin-dashboard/invoice-form/vehicle_list", // Assuming collectvehicle is for vehicle list
      icon: <FaCar />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Vehicle Inspection",
      icon: <MdEmojiTransportation />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Inspection", path: "/admin-dashboard/inspection-management/newinspection", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Inspection List", path: "/admin-dashboard/inspection-management", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },

    // {
    //   title: "Vehicle Inspection",
    //   icon: <MdEmojiTransportation />,
    //   roles: ["admin", "sub admin"],
    //   subitems: [
    //     { title: "New Inspection", path: "/admin-dashboard/inspection-management/newinspection", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
    //     { title: "Inspection List", path: "/admin-dashboard/inspection-management", icon: <FaListOl />, roles: ["admin", "sub admin"] },
    //   ],
    // },

    {
      title: "Transport Management",
      icon: <MdEmojiTransportation />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Transport", path: "/admin-dashboard/transportation/newtransportation", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Transport List", path: "/admin-dashboard/transportation", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Cargo Management",
      icon: <GiCargoShip />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Shipment", path: "/admin-dashboard/cargo-management/newcargo", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Cargo List", path: "/admin-dashboard/cargo-management", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Collect",
      icon: <GiCargoShip />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Collect", path: "/admin-dashboard/collectvehicle/newcollect", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Collect List", path: "/admin-dashboard/collectvehicle", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Show Room",
      icon: <GiCargoShip />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Arrivals", path: "/admin-dashboard/delievered/newdeliever", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Stock List", path: "/admin-dashboard/delievered", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Sales",
      icon: <GiCargoShip />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "Sale Vehicle", path: "/admin-dashboard/sale-vehicle/new-sale", icon: <IoIosAddCircle />, roles: ["admin", "sub admin"] },
        { title: "Sale's List", path: "/admin-dashboard/sale-vehicle", icon: <FaListOl />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Ledgers",
      path: "/admin-dashboard/ledgers",
      icon: <MdHistory />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Bank Accounts",
      path: "/admin-dashboard/bank-accounts",
      icon: <PiBank />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Expense Management",
      path: "/admin-dashboard/expense-management",
      icon: <PiBank />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Settings",
      path: "/admin-dashboard/usercheck", // Assuming usercheck is for settings
      icon: <FaCog />,
      roles: ["admin"],
    },
  ];

  return (
    <SidebarContainer
      variant="permanent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <LogoContainer>
        <Image
          src="/logo.png"
          width={180}
          height={100}
          alt="logo"
          style={{ transition: "all 0.3s ease" }}
        />
      </LogoContainer>

      <Divider />

      <List sx={{ padding: 1 }}>
        {/* Analytics Item */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation("/admin-dashboard")}
            sx={{
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon>
              <AnalyticsOutlined />
            </ListItemIcon>
            <ListItemText
              primary="Analytics"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItemButton>
        </ListItem>

        {/* Menu Items */}
        {menuItems.map((item) =>
          item.roles.includes(userRole) ? (
            <Box key={item.title}>
              <ListItem disablePadding>
                <Tooltip title={item.title} placement="right" arrow>
                  <ListItemButton
                    onClick={() =>
                      item.subitems
                        ? toggleDropdown(item.title)
                        : handleNavigation(item.path)
                    } // Only navigate if no subitems
                    sx={{
                      borderRadius: 1,
                      "&:hover": { bgcolor: "action.hover" },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                    {item.subitems &&
                      (openDropdowns[item.title] ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {/* Submenu */}
              {item.subitems && (
                <Collapse
                  in={openDropdowns[item.title]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.subitems.map((subitem) =>
                      subitem.roles.includes(userRole) ? (
                        <ListItem key={subitem.title} disablePadding>
                          <ListItemButton
                            onClick={() => handleNavigation(subitem.path)}
                            sx={{
                              borderRadius: 1,
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {subitem.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={subitem.title}
                              primaryTypographyProps={{ variant: "body2" }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ) : null
                    )}
                  </List>
                </Collapse>
              )}
            </Box>
          ) : null
        )}

        <Divider sx={{ my: 1 }} />

        {/* Logout Button */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
              color: "error.main",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FaSignOutAlt />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </SidebarContainer>
  );
};

export default Sidebar;