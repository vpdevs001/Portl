export type CreateVisitorRequestInput = {
  visitorType: 'guest' | 'delivery' | 'cab' | 'service_staff' | 'admin_visitor';
  name: string;
  phone?: string;
  purpose?: string;
  flatId?: string;
  photo?: string;
  // Non-cab vehicle plate (e.g. a delivery rider's bike). Cab plates go in
  // details.vehicleNumber instead.
  vehicleNumber?: string;
  source?: 'guard_request' | 'pre_approval' | 'admin_initiated';
  approverType?: 'resident' | 'admin';
  details?: {
    companyName?: string;
    orderId?: string;
    providerName?: string;
    vehicleNumber?: string;
    driverName?: string;
    serviceType?: string;
    company?: string;
  };
};

export type RespondVisitorRequestInput = {
  status: 'approved' | 'rejected';
};

export type UploadVisitorPhotoInput = {
  fileName: string;
  contentType: string;
  base64: string;
};

export type RegisterPushTokenInput = {
  expoPushToken: string;
  deviceId?: string;
};
