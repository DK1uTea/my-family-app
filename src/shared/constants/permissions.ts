export enum ModuleKey {
  Calendar = "event-calendar",
  Event = "event",
  ReportingTool = "reporting-tool",
  CustomerActivation = "customer-activation",
}

export const PERMISSION_ALL_WILDCARD = "*";

const EVENT_LIST_PERMISSIONS = {
  Draft: `${ModuleKey.Event}.list.draft`,
  Active: `${ModuleKey.Event}.list.active`,
  Deleted: `${ModuleKey.Event}.list.deleted`,
} as const;

type TPermissionChild = {
  name: string;
  key: `${ModuleKey}.${string}`;
};

type TPermission = {
  name: string;
  key: `${ModuleKey}.${string}`;
  type: "CHECKBOX" | "RADIO";
  children: TPermissionChild[];
};

export const PERMISSIONS_TREE: TPermission[] = [
  {
    name: "Event Management",
    key: `${ModuleKey.Event}.management`,
    type: "CHECKBOX",
    children: [
      { name: "View Draft List", key: EVENT_LIST_PERMISSIONS.Draft },
      { name: "View Active List", key: EVENT_LIST_PERMISSIONS.Active },
      { name: "View Deleted List", key: EVENT_LIST_PERMISSIONS.Deleted },
      { name: "Create", key: `${ModuleKey.Event}.create` },
      { name: "Update", key: `${ModuleKey.Event}.update` },
      { name: "Delete", key: `${ModuleKey.Event}.delete` },
      { name: "Show Analytic", key: `${ModuleKey.Event}.show-analytic` },
      { name: "Export Event", key: `${ModuleKey.Event}.export-event` },
      { name: "View Address List", key: `${ModuleKey.Event}.address.list` },
      { name: "Create Address", key: `${ModuleKey.Event}.address.create` },
      { name: "Update Address", key: `${ModuleKey.Event}.address.update` },
      { name: "Delete Address", key: `${ModuleKey.Event}.address.delete` },
      { name: "Comment", key: `${ModuleKey.Event}.comment` },
      { name: "Duplicate Event", key: `${ModuleKey.Event}.duplicate-event` },
      { name: "Manage Files", key: `${ModuleKey.Event}.manage-files` },
      { name: "Transfer Event", key: `${ModuleKey.Event}.transfer-event` },
      { name: "View Product List", key: `${ModuleKey.Event}.product.list` },
      { name: "View Product Detail", key: `${ModuleKey.Event}.product.detail` },
      { name: "Manage Product Cart", key: `${ModuleKey.Event}.product.cart` },
      { name: "Show Price", key: `${ModuleKey.Event}.product.show-price` },
      { name: "Transfer Event", key: `${ModuleKey.Event}.transfer-event` },
    ],
  },
  {
    name: "Event Calendar Management",
    key: `${ModuleKey.Calendar}.calendar.management`,
    type: "CHECKBOX",
    children: [
      { name: "View List", key: `${ModuleKey.Calendar}.list` },
      { name: "Create", key: `${ModuleKey.Calendar}.create` },
      { name: "Update", key: `${ModuleKey.Calendar}.update` },
      { name: "Delete", key: `${ModuleKey.Calendar}.delete` },
      { name: "Export Event", key: `${ModuleKey.Calendar}.export-event` },
      { name: "Comment", key: `${ModuleKey.Calendar}.comment` },
      { name: "Duplicate Event", key: `${ModuleKey.Calendar}.duplicate-event` },
      { name: "Manage Files", key: `${ModuleKey.Calendar}.manage-files` },
      { name: "Transfer Event", key: `${ModuleKey.Calendar}.transfer-event` },
    ],
  },
  {
    name: "Reporting Tool Management",
    key: `${ModuleKey.ReportingTool}.management`,
    type: "CHECKBOX",
    children: [
      {
        name: "Reporting Tool Management",
        key: `${ModuleKey.ReportingTool}.manager`,
      },
    ],
  },
  {
    name: "Customer Activation Management",
    key: `${ModuleKey.CustomerActivation}.management`,
    type: "RADIO",
    children: [
      { name: "Sale", key: `${ModuleKey.CustomerActivation}.sale` },
      {
        name: "Printing Agency",
        key: `${ModuleKey.CustomerActivation}.printing-agency`,
      },
      {
        name: "Installer Agency",
        key: `${ModuleKey.CustomerActivation}.installer-agency`,
      },
      {
        name: "Internal Admin",
        key: `${ModuleKey.CustomerActivation}.internal-admin`,
      },
    ],
  },
];

const EVENT_PRODUCT_PERMISSIONS = {
  List: `${ModuleKey.Event}.product.list`,
  Detail: `${ModuleKey.Event}.product.detail`,
  Cart: `${ModuleKey.Event}.product.cart`,
  ShowPrice: `${ModuleKey.Event}.product.show-price`,
} as const;

export const PERMISSIONS = {
  Event: {
    Management: `${ModuleKey.Event}.management`,
    List: EVENT_LIST_PERMISSIONS,
    Create: `${ModuleKey.Event}.create`,
    Update: `${ModuleKey.Event}.update`,
    Delete: `${ModuleKey.Event}.delete`,
    ShowAnalytic: `${ModuleKey.Event}.show-analytic`,
    ExportEvent: `${ModuleKey.Event}.export-event`,
    AddressList: `${ModuleKey.Event}.address.list`,
    AddressCreate: `${ModuleKey.Event}.address.create`,
    AddressUpdate: `${ModuleKey.Event}.address.update`,
    AddressDelete: `${ModuleKey.Event}.address.delete`,
    Comment: `${ModuleKey.Event}.comment`,
    DuplicateEvent: `${ModuleKey.Event}.duplicate-event`,
    ManageFiles: `${ModuleKey.Event}.manage-files`,
    TransferEvent: `${ModuleKey.Event}.transfer-event`,
    Product: EVENT_PRODUCT_PERMISSIONS,
  },
  Calendar: {
    Management: `${ModuleKey.Calendar}.management`,
    List: `${ModuleKey.Calendar}.list`,
    Create: `${ModuleKey.Calendar}.create`,
    Update: `${ModuleKey.Calendar}.update`,
    Delete: `${ModuleKey.Calendar}.delete`,
    ExportEvent: `${ModuleKey.Calendar}.export-event`,
    Comment: `${ModuleKey.Calendar}.comment`,
    DuplicateEvent: `${ModuleKey.Calendar}.duplicate-event`,
    ManageFiles: `${ModuleKey.Calendar}.manage-files`,
    TransferEvent: `${ModuleKey.Calendar}.transfer-event`,
  },
  Product: EVENT_PRODUCT_PERMISSIONS,
  ReportingTool: {
    Management: `${ModuleKey.ReportingTool}.management`,
    Manager: `${ModuleKey.ReportingTool}.manager`,
  },
  CustomerActivation: {
    Management: `${ModuleKey.CustomerActivation}.management`,
    Sale: `${ModuleKey.CustomerActivation}.sale`,
    PrintingAgency: `${ModuleKey.CustomerActivation}.printing-agency`,
    InstallerAgency: `${ModuleKey.CustomerActivation}.installer-agency`,
    InternalAdmin: `${ModuleKey.CustomerActivation}.internal-admin`,
  },
} as const;

/** Keys that grant access to the Event module */
export const EVENT_LIST_ACCESS_KEYS: string[] = Object.values(PERMISSIONS.Event.List);

export const EVENT_ACCESS_KEYS: string[] = [
  PERMISSIONS.Event.Management,
  ...EVENT_LIST_ACCESS_KEYS,
];
