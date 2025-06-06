import {notification} from "antd";

const errorMessage = (message: string) => {
  notification.error({
    message: `Error`,
    description: message,
    showProgress: true,
    pauseOnHover: true,
  });
};

export default errorMessage;
