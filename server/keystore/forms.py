from django import forms

from .models import WhisperUser


class UserForm(forms.ModelForm):

    password1 = forms.CharField(label='Password')
    password2 = forms.CharField(label='Password confirmation')

    class Meta:
        model = WhisperUser
        fields = ("username", "email", "public_key")
    
    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super(UserForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        user.verification_code = user.generate_verification_code()
        user.send_email_verify()
        if commit:
            user.save()
        return user

class FriendForm(forms.Form):
    username = forms.CharField(label="Friend")

    def clean_username(self):
        username = self.cleaned_data['username']
        return WhisperUser.objects.get(username=username)
