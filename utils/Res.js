// utils/Res.js
class Res {
  // Hằng số định nghĩa các mã trạng thái HTTP
  static STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  };

  // Hằng số định nghĩa các thông báo lỗi phổ biến
  static MESSAGE = {
    SUCCESS: "Success",
    CREATED: "Resource created successfully",
    BAD_REQUEST: "Invalid request",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    NOT_FOUND: "Resource not found",
    INTERNAL_SERVER_ERROR: "Internal server error",
  };

  // Phản hồi thành công
  static success(
    res,
    data = null,
    message = Res.MESSAGE.SUCCESS,
    status = Res.STATUS.SUCCESS
  ) {
    return res.status(status).json({
      status: "success",
      message,
      data,
    });
  }

  // Phản hồi lỗi
  static error(
    res,
    message = Res.MESSAGE.INTERNAL_SERVER_ERROR,
    status = Res.STATUS.INTERNAL_SERVER_ERROR,
    error = null
  ) {
    return res.status(status).json({
      status: "error",
      message,
      error,
    });
  }

  // Phản hồi lỗi "Not Found"
  static notFound(res, message = Res.MESSAGE.NOT_FOUND) {
    return Res.error(res, message, Res.STATUS.NOT_FOUND);
  }

  // Phản hồi lỗi "Unauthorized"
  static unauthorized(res, message = Res.MESSAGE.UNAUTHORIZED) {
    return Res.error(res, message, Res.STATUS.UNAUTHORIZED);
  }

  // Phản hồi lỗi "Bad Request"
  static badRequest(res, message = Res.MESSAGE.BAD_REQUEST) {
    return Res.error(res, message, Res.STATUS.BAD_REQUEST);
  }

  // Phản hồi lỗi "Forbidden"
  static forbidden(res, message = Res.MESSAGE.FORBIDDEN) {
    return Res.error(res, message, Res.STATUS.FORBIDDEN);
  }
}

module.exports = Res;
