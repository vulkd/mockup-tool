import Vue from "vue"
import store from "./store";
import Router from "vue-router"

import Home from "@/views/Home.vue"
import NotFound from "@/views/404.vue"
import RouterViewContainer from '@/components/RouterViewContainer';

Vue.use(Router);

function guardRedirectIfNotAuthenticated(to, from, next) {
  if (store.state.Auth.isAuthenticated) next();
  else next("/signin");
  // next();
}

function guardRedirectIfAuthenticated(to, from, next) {
  if (store.state.Auth.isAuthenticated) next("/app");
  else next();
  // next();
}

const routesPublic = [
  {
    path: "/",
    name: "home",
    component: Home,
    beforeEnter: guardRedirectIfAuthenticated
  },
  {
    path: "/join",
    name: "join",
    beforeEnter: guardRedirectIfAuthenticated,
    component: () => import(/* webpackChunkName: "firstorder" */ "./views/Join.vue")
  },
  {
    path: "/signin",
    name: "signin",
    alias: ["/forgotpassword"],
    beforeEnter: guardRedirectIfAuthenticated,
    component: () => import(/* webpackChunkName: "firstorder" */ "./views/Signin.vue")
  },
  {
    path: "/about",
    name: "about",
    component: () => import(/* webpackChunkName: "firstorder" */ "./views/About.vue")
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import(/* webpackChunkName: "fourthorder" */ "./views/Contact.vue")
  },
  {
    path: "/legal/privacy",
    name: "legal-privacy",
    component: () => import(/* webpackChunkName: "fourthorder" */ "./views/LegalPrivacy.vue")
  },
  {
    path: "/legal/tos",
    name: "legal-tos",
    component: () => import(/* webpackChunkName: "fourthorder" */ "./views/LegalTos.vue")
  },
  {
    path: "/reset/:token",
    name: "reset",
    beforeEnter: guardRedirectIfAuthenticated,
    component: () => import(/* webpackChunkName: "thirdorder" */ "./views/ResetPassword.vue")
  },
  {
    path: "/activate/:token",
    name: "activate",
    beforeEnter: guardRedirectIfAuthenticated,
    component: () => import(/* webpackChunkName: "fourthorder" */ "./views/ActivateAccount.vue")
  },
];

const routesAccount = [
  {
    path: "/account",
    name: "account",
    redirect: { name: 'application' },
    beforeEnter: guardRedirectIfNotAuthenticated,
    component: () => import(/* webpackChunkName: "secondorder" */ "./views/Application.vue"),
    children: [
      {
        path: "profile",
        name: "account-settings-user",
        beforeEnter: guardRedirectIfNotAuthenticated,
        component: () => import(/* webpackChunkName: "secondorder" */ "./views/AccountSettingsUser.vue")
      },
      {
        path: "team",
        name: "account-settings-users",
        beforeEnter: guardRedirectIfNotAuthenticated,
        component: () => import(/* webpackChunkName: "secondorder" */ "./views/AccountSettingsUsers.vue")
      },
      {
        path: "billing",
        name: "account-settings-billing",
        beforeEnter: guardRedirectIfNotAuthenticated,
        component: () => import(/* webpackChunkName: "secondorder" */ "./views/AccountSettingsBilling.vue")
      }
    ]
  }
];

const routesApplication = [
  {
    path: "/app",
    name: "application",
    redirect: { name: "application-library-mockups" },
    beforeEnter: guardRedirectIfNotAuthenticated,
    component: () => import(/* webpackChunkName: "secondorder" */ "./views/Application.vue"),
    children: [
      {
        path: 'library',
        name: 'application-library',
        redirect: { name: 'application' },
        beforeEnter: guardRedirectIfNotAuthenticated,
        component: RouterViewContainer,
        children: [
          {
            path: "mockups",
            name: "application-library-mockups",
            beforeEnter: guardRedirectIfNotAuthenticated,
            component: () => import(/* webpackChunkName: "secondorder" */ "./views/ApplicationLibraryMockups.vue")
          },
          {
            path: "base-images",
            name: "application-library-base-images",
            beforeEnter: guardRedirectIfNotAuthenticated,
            component: () => import(/* webpackChunkName: "secondorder" */ "./views/ApplicationLibraryBaseImages.vue")
          },
          {
            path: "brand-images",
            name: "application-library-brand-images",
            beforeEnter: guardRedirectIfNotAuthenticated,
            component: () => import(/* webpackChunkName: "secondorder" */ "./views/ApplicationLibraryBrandImages.vue")
          }
        ]
      },
      {
        path: 'create',
        name: 'application-create',
        redirect: { name: 'application' },
        beforeEnter: guardRedirectIfNotAuthenticated,
        component: RouterViewContainer,
        children: [
          {
            path: "mockup/:id?",
            name: "application-create-mockup",
            beforeEnter: guardRedirectIfNotAuthenticated,
            component: () => import(/* webpackChunkName: "secondorder" */ "./views/ApplicationCreateMockup.vue")
          },
          {
            path: "base-image/:id?",
            name: "application-create-base-image",
            beforeEnter: guardRedirectIfNotAuthenticated,
            component: () => import(/* webpackChunkName: "secondorder" */ "./views/ApplicationCreateBaseImage.vue")
          }
        ]
      },
    ]
  }
]

const router = new Router({
  mode: "history",
  saveScrollPosition: true,
  scrollBehavior (to, from, savedPosition) {
    // https://router.vuejs.org/guide/advanced/scroll-behavior.html
    return (to.hash) ? { selector: to.hash } : savedPosition ? savedPosition : { x: 0, y: 0 };
  },
  linkExactActiveClass: 'text-brand-500 border-brand-500',
  routes: [
    ...routesPublic,
    ...routesAccount,
    ...routesApplication,
    {
      path: "*",
      name: "notfound",
      component: () => import(/* webpackChunkName: "thirdorder" */ "./views/404.vue")
    }
  ]
})

export default router;
