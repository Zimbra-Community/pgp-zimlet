Name:           pgp-zimlet
Version:        2.3.1
Release:        1%{?dist}
Summary:        Zimbra OpenPGP Zimlet

Group:          Applications/Internet
License:        GPLv2
URL:            https://github.com/Zimbra-Community/pgp-zimlet
Source0:        https://github.com/Zimbra-Community/pgp-zimlet/archive/%{version}.tar.gz

Requires:       zimbra-core >= 8.5
BuildRequires:  zip
BuildArch:      noarch

%description
Adding PGP support to Zimbra Collaboration Suite.


%prep
%setup -q


%build
cat tk_barrydegraaff_zimbra_openpgp/lang/*.js >> tk_barrydegraaff_zimbra_openpgp/lang.js
echo -e "\n\r\n\r}" >> tk_barrydegraaff_zimbra_openpgp/lang.js
grep -lZr -e "_dev/" "tk_barrydegraaff_zimbra_openpgp/" | xargs -0 sed -i "s^_dev/^^g"
cd tk_barrydegraaff_zimbra_openpgp
rm -Rf lang
zip -r tk_barrydegraaff_zimbra_openpgp.zip *


%install
mkdir -p $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra
cp -R tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.zip $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra


%post
su - zimbra -c "zmzimletctl deploy /opt/zimbra/zimlets-extra/tk_barrydegraaff_zimbra_openpgp.zip"
su - zimbra -c "zmprov fc all"


%preun
su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_zimbra_openpgp"
su - zimbra -c "zmprov fc all"


%files
/opt/zimbra/zimlets-extra/tk_barrydegraaff_zimbra_openpgp.zip


%changelog
* Fri Apr 29 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.1-1
- New release update.

* Wed Apr 27 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.7-2
- Add "flushCache" after installing/uninstalling.

* Tue Apr 26 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.7-1
- Update to release 2.2.7.

* Sun Apr 24 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.5-1
- Initial release 2.2.5 from upstream.
