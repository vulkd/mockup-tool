<template>
    <div class="w-full border-b dark:border-gray-800 subpixel-antialiased">
        <div class="w-full flex px-4 mx-auto items-center justify-between">
         <h1 class="text-xl tracking-wider py-1 ">
            <router-link to="/" class="flex items-baseline hover:no-underline select-none">
                <span class='font-bold'>BYZAN</span>
                <span>TINE</span>
            </router-link>
        </h1>
        <nav class="text-xs flex items-center sm:pl-2 select-none justify-end">
           <router-link to="/about" class="py-2 block  sm:ml-6 md:ml-8 md:px-3">About</router-link>
           <router-link to="/contact" class="py-2 block  ml-6 md:ml-8 md:px-3">Contact</router-link>
           <router-link v-if="isAuthenticated" to="/account" class="py-2 block  ml-6 md:ml-8 md:px-3">Account</router-link>
           <span v-if="isAuthenticated" class="py-2 block  fake-link cursor-pointer ml-6 md:ml-8 md:px-3" @click="logout">Logout</span>
           <span v-if="!isAuthenticated" class="py-2 block  fake-link cursor-pointer ml-6 md:ml-8 block md:px-3" @click="signin">Sign In</span>
           <router-link v-if="!isAuthenticated" to="/join" class="py-2 block  block ml-6 md:ml-8 rounded-lg px-3">Join</router-link>
       </nav>
   </div>
</div>
</template>

<script>
import Logo from '@/components/Logo';

export default {
    components: {
        Logo
    },
    computed: {
    	isAuthenticated() {
    		return this.$store.state.Auth.isAuthenticated;
    	}
    },
    methods: {
    	logout() {
    		this.$store.dispatch("Auth/logout");
    	},
    	signin() {
    		if (this.$route.path !== "/signin") {
    			this.$router.push("/signin");
    		}
    		this.$bus.$emit("signin-clicked");
    	},
    	onContactClick() {
    		if (this.$route.path === "/contact") {
    			window.scrollTo(0, 0);
    		} else {
    			this.$router.push("/contact");
    		}
    	}
    }
};
</script>
