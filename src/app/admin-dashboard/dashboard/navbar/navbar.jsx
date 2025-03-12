"use client";
import { Person, ExitToApp } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Logout } from "@/app/Store/Slice";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from "@mui/material";

const Navbar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get username from Redux state
  const username = useSelector((state) => state.user.username);
  const open = Boolean(anchorEl);

  // Redirect to /admin if the username is empty
  useEffect(() => {
    if (!username) {
      router.push("/admin");
    }
  }, [username, router]);

  // Handle menu open/close
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(Logout());
    handleMenuClose();
    router.push("/admin");
  };

  // Capitalize and format page title
  const getPageTitle = () => {
    const page = pathname.split("/").pop();
    return page === "Submittions" ? "Submissions" : page;
  };

  return (
    <AppBar 
      position="static" 
      elevation={1}
      sx={{ 
        height: 64,
        bgcolor: "white",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
        {/* Page Title */}
        <Tooltip title={`Current Page: ${getPageTitle()}`} arrow>
          <Typography
            variant="h6"
            sx={{
              color: "grey.800",
              fontWeight: "bold",
              textTransform: "capitalize",
              ml: 2,
              transition: "color 0.3s",
              "&:hover": { color: "primary.main" },
            }}
          >
            {getPageTitle()}
          </Typography>
        </Tooltip>

        {/* User Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title={`Logged in as: ${username || "Guest"}`} arrow>
            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                px: 2,
                py: 0.5,
                bgcolor: "grey.100",
                borderRadius: 2,
                transition: "background-color 0.3s",
                "&:hover": { bgcolor: "grey.200" },
              }}
            >
              {username || "Guest"}
            </Typography>
          </Tooltip>

          <IconButton
            onClick={handleMenuOpen}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              p: 0.5,
              transition: "all 0.3s",
              "&:hover": { 
                bgcolor: "primary.light",
                transform: "scale(1.1)",
              },
            }}
          >
            <Badge
              overlap="circular"
              variant={isHovered ? "dot" : "standard"}
              color="primary"
              invisible={!isHovered}
            >
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <Person sx={{ color: "white" }} />
              </Avatar>
            </Badge>
          </IconButton>

          {/* User Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                minWidth: 120,
                "&:hover": { bgcolor: "grey.50" },
              },
            }}
            TransitionProps={{ timeout: 200 }}
          >
            <MenuItem
              onClick={handleLogout}
              sx={{
                gap: 1,
                transition: "background-color 0.2s",
                "&:hover": { 
                  bgcolor: "grey.100",
                  "& .MuiSvgIcon-root": { color: "error.main" },
                },
              }}
            >
              <ExitToApp fontSize="small" />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;