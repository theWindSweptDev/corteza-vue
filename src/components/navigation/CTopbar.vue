<template>
  <div class="header-navigation d-flex align-items-center justify-content-between sticky-top pr-3 pl-5 ">
    <div
      class="d-flex text-nowrap flex-grow-1 align-items-center header h-100 w-100"
    >
      <template>
        <div
          class="spacer"
          :class="{
            'expanded': sidebarPinned,
          }"
        />
      </template>

      <div
        class="d-flex align-items-center ml-2 text-truncate mr-auto h-100"
      >
        <h2
          class="d-none d-sm-block mb-0"
        >
          <slot name="title" />
        </h2>

      </div>

      <div class="ml-3">
        <slot name="tools" />
      </div>

      <b-button
        v-if="!hideAppSelector"
        variant="outline-light"
        :href="appSelectorURL"
        size="lg"
        class="d-flex align-items-center justify-content-center text-dark border-0 nav-icon rounded-circle ml-2"
      >
        <font-awesome-icon
          class="m-0 h5"
          :icon="['fas', 'grip-horizontal']"
        />
      </b-button>

      <b-dropdown
        size="lg"
        variant="outline-light"
        class="nav-icon mx-1"
        toggle-class="text-decoration-none text-dark rounded-circle border-0 w-100"
        menu-class="border-0 shadow-sm text-dark font-weight-bold mt-2"
        right
        no-caret
      >
        <template #button-content>
          <div
            class="d-flex align-items-center justify-content-center"
          >
            <font-awesome-icon
              class="m-0 h5"
              :icon="['far', 'question-circle']"
            />
            <span class="sr-only">
              Help
            </span>
          </div>
        </template>
        <div>
          <slot name="help-dropdown" />
        </div>
        <b-dropdown-item
          href="https://forum.cortezaproject.org/"
          target="_blank"
        >
          {{ labels.helpForum }}
        </b-dropdown-item>
        <b-dropdown-item
          :href="documentationURL"
          target="_blank"
        >
          {{ labels.helpDocumentation }}
        </b-dropdown-item>
        <b-dropdown-item
          href="mailto:info@crust.tech"
          target="_blank"
        >
          {{ labels.helpFeedback }}
        </b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item
          disabled
          class="small"
        >
          {{ labels.helpVersion }}
          <br>
          {{ frontendVersion }}
        </b-dropdown-item>
      </b-dropdown>
      <b-dropdown
        data-v-onboarding="profile"
        size="lg"
        variant="outline-light"
        class="nav-user-icon"
        toggle-class="nav-icon text-decoration-none text-dark rounded-circle border"
        menu-class="border-0 shadow-sm text-dark font-weight-bold mt-2"
        right
        no-caret
      >
        <template #button-content>
          <div
            class="d-flex align-items-center justify-content-center"
          >
            <font-awesome-icon
              class="m-0 h5"
              :icon="['far', 'user']"
            />
            <span class="sr-only">
              {{ labels.helpForum }}
            </span>
          </div>
        </template>
        <b-dropdown-text class="text-muted mb-2">
          {{ labels.userSettingsLoggedInAs  }}
        </b-dropdown-text>
        <div>
          <slot name="avatar-dropdown" />
        </div>
        <b-dropdown-item
          :href="userProfileURL"
          target="_blank"
        >
          {{ labels.userSettingsProfile }}
        </b-dropdown-item>
        <b-dropdown-item
          :href="changePasswordURL"
          target="_blank"
        >
          {{ labels.userSettingsChangePassword }}
        </b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item
          href=""
          @click="$auth.logout()"
          class="mt-2"
        >
          {{ labels.userSettingsLogout }}
        </b-dropdown-item>
      </b-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sidebarPinned: {
      type: Boolean,
      required: true,
      default: false,
    },

    hideAppSelector: {
      type: Boolean,
      required: false,
      default: false,
    },

    appSelectorURL: {
      type: String,
      default: '../'
    },

    labels: {
      type: Object,
      required: true,
    },
  },

  computed: {
    userProfileURL () {
      return this.$auth.cortezaAuthURL
    },

    changePasswordURL () {
      return `${this.$auth.cortezaAuthURL}/change-password`
    },

    documentationURL () {
      const [year, month] = VERSION.split('.')
      return `https://docs.cortezaproject.org/corteza-docs/${year}.${month}/index.html`
    },

    frontendVersion () {
      /* eslint-disable no-undef */
      return VERSION
    },
  }
}
</script>

<style lang="scss" scoped>
$header-height: 64px;
$nav-width: 320px;
$nav-icon-size: 40px;
$nav-user-icon-size: 50px;

.icon-logo {
  height: calc(#{$header-height} / 2);
  background-repeat: no-repeat;
  background-position: center;
}

.nav-icon {
  width: $nav-icon-size;
  height: $nav-icon-size;
}

.nav-user-icon {
  width: $nav-user-icon-size;
  height: $nav-user-icon-size;
}

.header-navigation {
  width: 100vw;
  height: $header-height;
  background-color: #F3F3F5 !important;

  h2 {
    padding-left: calc(0.5rem + 2px);
  }
}

.spacer {
  min-width: 0px;
  -webkit-transition: min-width 0.15s ease-in-out;
  -moz-transition: min-width 0.15s ease-in-out;
  -o-transition: min-width 0.15s ease-in-out;
  transition: min-width 0.15s ease-in-out;

  &.expanded {
    min-width: calc(#{$nav-width} - 42px);
    -webkit-transition: min-width 0.2s ease-in-out;
    -moz-transition: min-width 0.2s ease-in-out;
    -o-transition: min-width 0.2s ease-in-out;
    transition: min-width 0.2s ease-in-out;
  }
}
</style>
