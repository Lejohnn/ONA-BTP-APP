#!/bin/bash

# Script de build pour ONA BTP Mobile
# Ce script facilite le déploiement avec les nouvelles configurations de diagnostic

echo "🚀 Démarrage du build ONA BTP Mobile..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Ce script doit être exécuté depuis le répertoire racine du projet"
    exit 1
fi

print_message "Vérification de l'environnement..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

# Vérifier si Ionic CLI est installé
if ! command -v ionic &> /dev/null; then
    print_warning "Ionic CLI n'est pas installé. Installation..."
    npm install -g @ionic/cli
fi

print_success "Environnement vérifié"

# Nettoyer les builds précédents
print_message "Nettoyage des builds précédents..."
rm -rf www/
rm -rf android/app/build/

# Installer les dépendances
print_message "Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

print_success "Dépendances installées"

# Build de l'application
print_message "Build de l'application..."
ionic build

if [ $? -ne 0 ]; then
    print_error "Échec du build"
    exit 1
fi

print_success "Build terminé"

# Synchroniser avec Capacitor
print_message "Synchronisation avec Capacitor..."
ionic capacitor sync

if [ $? -ne 0 ]; then
    print_error "Échec de la synchronisation Capacitor"
    exit 1
fi

print_success "Synchronisation Capacitor terminée"

# Build pour Android
print_message "Build pour Android..."
ionic capacitor build android

if [ $? -ne 0 ]; then
    print_error "Échec du build Android"
    exit 1
fi

print_success "Build Android terminé"

# Vérifier les fichiers de configuration
print_message "Vérification des configurations..."

# Vérifier le fichier de configuration Capacitor
if [ ! -f "capacitor.config.ts" ]; then
    print_error "Fichier capacitor.config.ts manquant"
    exit 1
fi

# Vérifier le fichier AndroidManifest.xml
if [ ! -f "android/app/src/main/AndroidManifest.xml" ]; then
    print_error "Fichier AndroidManifest.xml manquant"
    exit 1
fi

# Vérifier le fichier de configuration réseau
if [ ! -f "android/app/src/main/res/xml/network_security_config.xml" ]; then
    print_error "Fichier network_security_config.xml manquant"
    exit 1
fi

print_success "Configurations vérifiées"

# Afficher les informations de diagnostic
print_message "Informations de diagnostic:"
echo "📱 Application: ONA BTP Mobile"
echo "🌐 URL Odoo: https://btp.onaerp.com/jsonrpc"
echo "🗄️ Base de données: btptst"
echo "📁 APK généré: android/app/build/outputs/apk/debug/app-debug.apk"

print_success "Build terminé avec succès!"
print_message "Pour installer sur un appareil Android:"
echo "1. Activez le mode développeur sur votre appareil"
echo "2. Activez le débogage USB"
echo "3. Connectez votre appareil via USB"
echo "4. Exécutez: ionic capacitor run android"

print_message "Pour tester la connexion:"
echo "1. Installez l'application sur votre appareil"
echo "2. Ouvrez l'application"
echo "3. Utilisez les outils de diagnostic intégrés"
echo "4. Consultez le guide DIAGNOSTIC_MOBILE.md"

echo ""
print_success "🎉 Build mobile ONA BTP terminé!" 