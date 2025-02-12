import React from "react";
import PropTypes from "prop-types";
import "./LoadingSpinner.css";

function LoadingSpinner({ size, color }) {
  return (
    <div
      className="loading-spinner"
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: "transparent",
      }}
    ></div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  size: 40,      // default size if none provided
  color: "#6200ee", // default color if none provided
};

export default LoadingSpinner; 