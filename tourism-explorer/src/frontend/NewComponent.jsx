import React, { useEffect } from "react";
import { Typography } from '@mui/material';



function NewComponent(props) {

  useEffect(() => {
    /**
     * This callback notifies the WebSearch platform that this component
     * has fully loaded and is ready to render.
     *
     * This should be triggered only once, ideally from the
     * top-level parent component.
     *
     * Important: Invoke this only when the UI is fully ready
     * (e.g., after required API data has been loaded and the
     * primary content has rendered), not necessarily on
     * component mount.
     */
    props?.messageHandlers?.componentLoaded();
  }, []);
  // This API_URL will be used in api calls if using apis created under backend directory
  const API_URL = process.env.NODE_ENV === 'production' ? props.deployedBackendURL ? props.deployedBackendURL : '' : import.meta.env.VITE_API_URL;
  return (
    <div>
      <Typography variant="caption">hyperDart New Component</Typography>
    </div>
  );
};
export default NewComponent;