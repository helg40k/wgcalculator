import { notification } from "antd";

const errorMessage = (message: string) => {
  notification.error({
    description: message,
    message: "Error",
    pauseOnHover: true,
    showProgress: true,
  });
};

export default errorMessage;
