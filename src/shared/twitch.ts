import { ApiClient } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";

const clientId = "azvugapvimh4616vp98rw71vkttx0e";
const clientSecret = "civxjep7m8rujcewgpf3b2l7xjaxnu";
const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({
  authProvider,
});

export default apiClient;
