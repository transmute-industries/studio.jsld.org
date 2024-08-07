"use client"

import * as React from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import GitHubIcon from '@mui/icons-material/GitHub';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

import SaveIcon from '@mui/icons-material/Save';

import Editor from './Editor'
import RDFView from './RDFView'

import { Grid, Typography } from '@mui/material';

import LoadingButton from '@mui/lab/LoadingButton';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import pako from 'pako'
import * as jose from 'jose'
import { useRouter } from 'next/navigation';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const moreImportant = [{
  href: 'https://www.w3.org/TR/vc-data-model-2.0/',
  label: 'W3C VC',
  icon: <HistoryEduIcon />
},
{
  href: 'https://www.w3.org/TR/did-core/',
  label: 'W3C DID',
  icon: <HistoryEduIcon />
}]

const lessImportant = [{
  href: 'https://github.com/transmute-industries/studio.jsld.org',
  label: 'Source Code',
  icon: <GitHubIcon />
}]

export default function MiniDrawer({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  const [context, setContext] = React.useState(`{
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      {
        "@version": 1.1,
        "@language": "ar-EG",
        "@direction": "rtl"
      }
    ]
  }  
  `);

  const [document, setDocument] = React.useState(`{
    "id": "urn:uuid:0123",
    "type": ["VerifiableCredential"],
    "credentialSubject": {
       "id": "did:web:brand.owner.example",
       "https://brand.owner.example/publisher": "مكتبة"
    }
  }
  
  
  `);

  const [rdf, setRdf] = React.useState(null);
  const router = useRouter()
  const [isCanonicalizing, setIsCanonicalizing] = React.useState(false);
  const setPakoFragment = async () => {
    const config = JSON.stringify({
      document,
      context
    })
    const deflated = await pako.deflate(new TextEncoder().encode(config))
    const encoded = jose.base64url.encode(deflated)
    router.push('#pako:' + encoded)
  }

  const pakoFragment = async () => {
    try {
      const fragment = window.location.href.split('#pako:').pop()
      if (fragment) {
        const decoded = jose.base64url.decode(fragment)
        const inflated = await pako.inflate(decoded)
        const parsed = JSON.parse(new TextDecoder().decode(inflated))
        setDocument(parsed.document)
        setContext(parsed.context)
        toast.success('Restored')
      }
    } catch (e) {
      console.error(e)
    }

  }

  React.useEffect(() => {
    pakoFragment()
  }, [])

  const canonicalization = async () => {
    setRdf(null)
    setIsCanonicalizing(true)
    const response = await fetch('/api/canonicalization', {
      method: "POST",
      body: JSON.stringify({
        context,
        document,
      }),
    })
    // success
    if (response.status < 300) {
      const content = await response.json()
      setRdf(content['application/n-quads'])
      toast.success('application/n-quads.')
      setPakoFragment()
      // failure
    } else if (response.status <= 600) {
      try {
        const problem = await response.json()
        toast.error(problem.title)
      } catch (e) {
        toast.error("Something went wrong")
      }
    }
    setIsCanonicalizing(false)
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Context Studio
          </Typography>
          <LoadingButton variant='outlined' onClick={canonicalization} loading={isCanonicalizing} endIcon={<SaveIcon />}>Canonicalize</LoadingButton>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {moreImportant.map((item) => {
            return (<ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
                href={item.href}
                target='_blank'
                rel="noopener"
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>)
          })}
        </List>
        <Divider />
        <List>
          {lessImportant.map((item) => {
            return (<ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
                href={item.href}
                target='_blank'
                rel="noopener"
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>)
          })}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 1 }}>
        <DrawerHeader />
        <ToastContainer theme={'dark'} position='bottom-right' />
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography>Document</Typography>
            <Editor value={document} setValue={setDocument} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>Context</Typography>
            <Editor value={context} setValue={setContext} />
          </Grid>
          {rdf !== null && <Grid item xs={12} sm={12}>
            <Typography>Canonicalization</Typography>
            <RDFView value={rdf} />
          </Grid>}
        </Grid>
      </Box>
    </Box>
  );
}
