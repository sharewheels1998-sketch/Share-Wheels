const express = require("express");
const adminController = require("../controllers/adminController");
const adminAdController = require("../controllers/adminAdController");
const adminLocationController = require("../controllers/adminLocationController");
const adminFeedbackController = require("../controllers/adminFeedbackController");
const adminLegalController = require("../controllers/adminLegalController");
const adminLookupController = require("../controllers/adminLookupController");
const adminSubscriptionController = require("../controllers/adminSubscriptionController");
const adminVehicleFareController = require("../controllers/adminVehicleFareController");
const adminStaffController = require("../controllers/adminStaffController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const requireAdminPermission = require("../middlewares/requireAdminPermission");
const adUploadMiddleware = require("../middlewares/adUploadMiddleware");

const router = express.Router();

router.post("/register", adminController.register);
router.post("/login", adminController.login);

router.use(adminAuthMiddleware);
router.get("/me", adminController.me);

router.get("/staff/meta", requireAdminPermission("admin_staff", "view"), adminStaffController.meta);
router.get("/staff", requireAdminPermission("admin_staff", "view"), adminStaffController.list);
router.post("/staff", requireAdminPermission("admin_staff", "create"), adminStaffController.create);
router.patch("/staff/:id", requireAdminPermission("admin_staff", "edit"), adminStaffController.update);
router.delete("/staff/:id", requireAdminPermission("admin_staff", "delete"), adminStaffController.remove);

router.get("/dashboard/stats", requireAdminPermission("dashboard", "view"), adminController.dashboardStats);
router.get("/users", requireAdminPermission("users", "view"), adminController.listUsers);
router.post("/users", requireAdminPermission("users", "create"), adminController.createUser);
router.post("/users/backfill-passwords", requireAdminPermission("users", "edit"), adminController.backfillUserPasswords);
router.patch("/users/:id/verify", requireAdminPermission("users", "edit"), adminController.updateUserVerification);
router.patch("/users/:id", requireAdminPermission("users", "edit"), adminController.updateUser);
router.delete("/users/:id", requireAdminPermission("users", "delete"), adminController.deleteUser);
router.get("/rides", requireAdminPermission("rides", "view"), adminController.listRides);
router.get("/passenger-rides", requireAdminPermission("passenger_rides", "view"), adminController.listPassengerRides);
router.get("/couriers", requireAdminPermission("couriers", "view"), adminController.listCouriers);
router.patch("/rides/:id/status", requireAdminPermission("rides", "edit"), adminController.updateRideStatus);
router.get("/tracking/active", requireAdminPermission("live_tracking", "view"), adminController.activeTracking);
router.get("/maps/directions", requireAdminPermission("live_tracking", "view"), adminController.routeDirections);
router.get("/tracking/:id", requireAdminPermission("live_tracking", "view"), adminController.trackingDetail);

router.get("/ads/meta", requireAdminPermission("ads", "view"), adminAdController.getMeta);
router.get("/ads", requireAdminPermission("ads", "view"), adminAdController.listAds);
router.post("/ads", requireAdminPermission("ads", "create"), adminAdController.createAd);
router.post("/ads/upload", requireAdminPermission("ads", "create"), adUploadMiddleware, adminAdController.uploadMedia);
router.patch("/ads/:id", requireAdminPermission("ads", "edit"), adminAdController.updateAd);
router.delete("/ads/:id", requireAdminPermission("ads", "delete"), adminAdController.deleteAd);

router.get("/locations", requireAdminPermission("locations", "view"), adminLocationController.listLocations);
router.post("/locations", requireAdminPermission("locations", "create"), adminLocationController.createLocation);
router.put("/locations/bulk", requireAdminPermission("locations", "edit"), adminLocationController.bulkUpsertLocations);
router.post("/locations/bulk", requireAdminPermission("locations", "edit"), adminLocationController.bulkUpsertLocations);
router.delete("/locations/all", requireAdminPermission("locations", "delete"), adminLocationController.clearAllLocations);
router.patch("/locations/:id", requireAdminPermission("locations", "edit"), adminLocationController.updateLocation);
router.delete("/locations/:id", requireAdminPermission("locations", "delete"), adminLocationController.deleteLocation);

router.get("/feedback", requireAdminPermission("feedback", "view"), adminFeedbackController.list);
router.patch("/feedback/:id", requireAdminPermission("feedback", "edit"), adminFeedbackController.update);

router.get("/legal/policies", requireAdminPermission("legal", "view"), adminLegalController.listPolicies);
router.put("/legal/policies", requireAdminPermission("legal", "edit"), adminLegalController.upsertPolicies);

router.get("/lookups", requireAdminPermission("lookup_types", "view"), adminLookupController.listTypes);
router.post("/lookups", requireAdminPermission("lookup_types", "create"), adminLookupController.createType);
router.post("/lookups/bulk", requireAdminPermission("lookup_types", "edit"), adminLookupController.bulkUpsertTypes);
router.patch("/lookups/:id", requireAdminPermission("lookup_types", "edit"), adminLookupController.updateType);
router.delete("/lookups/:id", requireAdminPermission("lookup_types", "delete"), adminLookupController.deleteType);

router.get("/subscription-plans/meta", requireAdminPermission("subscription_plans", "view"), adminSubscriptionController.getMeta);
router.get("/subscription-plans", requireAdminPermission("subscription_plans", "view"), adminSubscriptionController.listPlans);
router.post("/subscription-plans", requireAdminPermission("subscription_plans", "create"), adminSubscriptionController.createPlan);
router.patch("/subscription-plans/:id", requireAdminPermission("subscription_plans", "edit"), adminSubscriptionController.updatePlan);
router.delete("/subscription-plans/:id", requireAdminPermission("subscription_plans", "delete"), adminSubscriptionController.deletePlan);

router.get("/subscriptions", requireAdminPermission("subscribed_users", "view"), adminSubscriptionController.listSubscribedUsers);
router.get("/subscription-payments", requireAdminPermission("subscription_payments", "view"), adminSubscriptionController.listPayments);
router.post("/users/:userId/subscription", requireAdminPermission("subscribed_users", "edit"), adminSubscriptionController.assignPlanToUser);

router.get("/vehicle-fares", requireAdminPermission("vehicle_fares", "view"), adminVehicleFareController.listFares);
router.post("/vehicle-fares", requireAdminPermission("vehicle_fares", "create"), adminVehicleFareController.createFare);
router.patch("/vehicle-fares/:id", requireAdminPermission("vehicle_fares", "edit"), adminVehicleFareController.updateFare);
router.delete("/vehicle-fares/:id", requireAdminPermission("vehicle_fares", "delete"), adminVehicleFareController.deleteFare);

module.exports = router;
