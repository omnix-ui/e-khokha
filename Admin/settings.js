async function loadAdminProfile(){
 const result=await getAdminUser();
 if(!result)return false;
 const {user,profile}=result;
 const email=document.getElementById("profileEmail"),name=document.getElementById("profileName"),avatar=document.getElementById("profileAvatar");
 const displayName=profile.full_name||user.user_metadata?.full_name||"Admin";
 if(name)name.textContent=displayName;
 if(email)email.textContent=user.email||"—";
 if(avatar)avatar.textContent=displayName.charAt(0).toUpperCase();
 return true;
}
function showPasswordMessage(message,type=""){
 const box=document.getElementById("passwordMessage");
 box.textContent=message;
 box.className=`form-message ${type}`.trim();
}
async function changePassword(e){
 e.preventDefault();
 showPasswordMessage("");
 const password=document.getElementById("newPassword").value;
 const confirm=document.getElementById("confirmPassword").value;
 if(password.length<8){showPasswordMessage("Password must be at least 8 characters.","error");return}
 if(password!==confirm){showPasswordMessage("Passwords do not match.","error");return}
 const button=document.getElementById("changePasswordBtn");
 button.disabled=true;
 button.textContent="Updating...";
 const {error}=await supabaseClient.auth.updateUser({password});
 if(error){
  console.error("Password update error:",error);
  showPasswordMessage(error.message||"Unable to change password.","error");
  button.disabled=false;
  button.textContent="Change Password";
  return;
 }
 document.getElementById("passwordForm").reset();
 showPasswordMessage("Password changed successfully.","success");
 button.disabled=false;
 button.textContent="Change Password";
}
async function logoutAdmin(){
 await supabaseClient.auth.signOut();
 location.href="login.html";
}
document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 await loadAdminProfile();
 document.getElementById("passwordForm").addEventListener("submit",changePassword);
 document.getElementById("settingsLogoutBtn").addEventListener("click",logoutAdmin);
});